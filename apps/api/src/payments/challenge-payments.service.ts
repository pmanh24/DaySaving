import { Inject, Injectable, forwardRef } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { HydratedDocument, Types, type Model } from "mongoose";
import type { ChallengePayment } from "@saving/shared";
import { ApiError } from "../common/api-error";
import { ChallengePaymentDocument } from "../database/schemas";
import { ChallengesService } from "../challenges/challenges.service";
import { SavingPlansStore } from "../saving-plans/saving-plans.store";
import { PayosService } from "./payos/payos.service";

type StoredChallengePayment = HydratedDocument<ChallengePaymentDocument> & { _id: Types.ObjectId; createdAt?: Date };
const ACTIVE_STATUSES = ["CREATING", "PENDING", "PROCESSING"];

interface CreateChallengePaymentInput { number: number; idempotencyKey: string; }

@Injectable()
export class ChallengePaymentsService {
  constructor(
    @InjectModel(ChallengePaymentDocument.name) private readonly model: Model<ChallengePaymentDocument>,
    private readonly challenges: ChallengesService,
    private readonly store: SavingPlansStore,
    @Inject(forwardRef(() => PayosService)) private readonly payos: PayosService,
  ) {}

  async create(userId: string, challengeId: string, input: CreateChallengePaymentInput): Promise<ChallengePayment> {
    const userObjectId = this.objectId(userId);
    const challengeObjectId = this.objectId(challengeId);
    const existing = await this.model.findOne({ userId: userObjectId, idempotencyKey: input.idempotencyKey }).exec();
    if (existing) {
      if (existing.challengeId.toString() !== challengeId || existing.number !== input.number) throw new ApiError("IDEMPOTENCY_CONFLICT", "Idempotency key đã được dùng cho yêu cầu khác.", 409);
      return this.toPayment(existing as StoredChallengePayment);
    }

    const board = this.challenges.board(userId, challengeId);
    const cell = board.cells.find((item) => item.number === input.number);
    if (!cell || cell.status !== "AVAILABLE") throw new ApiError("CELL_NOT_AVAILABLE", "Ô tiết kiệm này không còn khả dụng.", 409);
    if (board.today.checked) throw new ApiError("DAILY_LIMIT_REACHED", "Hôm nay bạn đã tiết kiệm rồi.", 409);

    const pending = await this.model.findOne({ userId: userObjectId, challengeId: challengeObjectId, status: { $in: ACTIVE_STATUSES } }).exec();
    if (pending) {
      if (pending.number === input.number) return this.toPayment(pending as StoredChallengePayment);
      throw new ApiError("PAYMENT_ALREADY_PENDING", "Bạn đang có một QR chờ thanh toán cho hôm nay.", 409);
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.expiryMinutes() * 60000);
    const orderCode = await this.nextOrderCode();
    const payment = new this.model({
      userId: userObjectId,
      challengeId: challengeObjectId,
      number: input.number,
      provider: "PAYOS",
      orderCode,
      paymentLinkId: null,
      amount: cell.amount,
      currency: "VND",
      description: `TKC${orderCode}`,
      checkoutUrl: null,
      qrCode: null,
      status: "CREATING",
      idempotencyKey: input.idempotencyKey,
      expiresAt,
      paidAt: null,
      cancelledAt: null,
      lastReconciledAt: null,
      providerReference: null,
      transactionDateTime: null,
      errorCode: null,
      errorMessage: null,
    }) as StoredChallengePayment;
    await payment.save();

    try {
      const provider = await this.payos.createPaymentLink({
        orderCode,
        amount: cell.amount,
        description: payment.description,
        returnUrl: process.env.PAYOS_RETURN_URL ?? "http://localhost:3000/payment/return",
        cancelUrl: process.env.PAYOS_CANCEL_URL ?? "http://localhost:3000/payment/cancel",
        expiredAt: Math.floor(expiresAt.getTime() / 1000),
      });
      payment.status = "PENDING";
      payment.paymentLinkId = provider.paymentLinkId;
      payment.checkoutUrl = provider.checkoutUrl;
      payment.qrCode = provider.qrCode;
      await payment.save();
      return this.toPayment(payment);
    } catch (error) {
      payment.status = "FAILED";
      payment.errorCode = "PAYMENT_CREATE_FAILED";
      payment.errorMessage = "Không thể tạo mã thanh toán.";
      await payment.save().catch(() => undefined);
      this.payos.logProviderFailure(error);
      throw new ApiError("PAYMENT_CREATE_FAILED", "Không thể tạo mã thanh toán.", 502);
    }
  }

  async get(userId: string, paymentId: string): Promise<ChallengePayment> {
    return this.toPayment(await this.owned(userId, paymentId));
  }

  async reconcile(userId: string, paymentId: string): Promise<ChallengePayment> {
    const payment = await this.owned(userId, paymentId);
    await this.expireIfNeeded(payment);
    if (["PAID", "CANCELLED", "EXPIRED", "FAILED"].includes(payment.status)) return this.toPayment(payment);
    const provider = await this.payos.getPaymentStatus(payment.orderCode);
    payment.lastReconciledAt = new Date();
    if (provider.status === "PAID") return this.confirmPaid(payment, provider.amount || payment.amount, provider.reference, provider.transactionDateTime);
    if (provider.status === "CANCELLED") { payment.status = "CANCELLED"; payment.cancelledAt = new Date(); }
    if (provider.status === "EXPIRED") payment.status = "EXPIRED";
    await payment.save();
    return this.toPayment(payment);
  }

  async cancel(userId: string, paymentId: string): Promise<ChallengePayment> {
    const payment = await this.owned(userId, paymentId);
    await this.expireIfNeeded(payment);
    if (payment.status === "PAID") throw new ApiError("PAYMENT_ALREADY_PAID", "Không thể hủy thanh toán đã hoàn tất.", 409);
    if (["CANCELLED", "EXPIRED", "FAILED"].includes(payment.status)) return this.toPayment(payment);
    await this.payos.cancelPayment(payment.paymentLinkId);
    payment.status = "CANCELLED";
    payment.cancelledAt = new Date();
    await payment.save();
    return this.toPayment(payment);
  }

  async webhook(payload: unknown): Promise<{ status: string; payment: ChallengePayment | null }> {
    const verified = await this.payos.verifyWebhook(payload);
    const payment = await this.model.findOne({ orderCode: verified.orderCode }).exec();
    if (!payment) throw new ApiError("PAYOS_ORDER_NOT_FOUND", "Không tìm thấy orderCode.", 404);
    if (payment.status === "PAID") return { status: "IGNORED_DUPLICATE", payment: this.toPayment(payment) };
    if (verified.code !== "00") return { status: "RECEIVED", payment: this.toPayment(payment) };
    return { status: "PROCESSED", payment: await this.confirmPaid(payment, verified.amount, verified.reference, verified.transactionDateTime) };
  }

  async hasOrderCode(orderCode: number): Promise<boolean> {
    return Boolean(await this.model.exists({ orderCode }));
  }

  private async confirmPaid(payment: StoredChallengePayment, providerAmount: number, providerReference: string | null, transactionDateTime: string | null): Promise<ChallengePayment> {
    if (providerAmount > 0 && payment.amount !== providerAmount) throw new ApiError("PAYMENT_AMOUNT_MISMATCH", "Số tiền thanh toán không khớp ô đã chọn.", 409);
    this.challenges.checkIn(payment.userId.toString(), payment.challengeId.toString(), payment.number, payment.idempotencyKey);
    const now = new Date();
    payment.status = "PAID";
    payment.paidAt = now;
    payment.lastReconciledAt = now;
    payment.providerReference = providerReference;
    payment.transactionDateTime = transactionDateTime;
    payment.errorCode = null;
    payment.errorMessage = null;
    await payment.save();
    return this.toPayment(payment);
  }

  private async owned(userId: string, paymentId: string): Promise<StoredChallengePayment> {
    if (!Types.ObjectId.isValid(paymentId)) throw new ApiError("PAYMENT_NOT_FOUND", "Không tìm thấy thanh toán.", 404);
    const payment = await this.model.findOne({ _id: new Types.ObjectId(paymentId), userId: this.objectId(userId) }).exec();
    if (!payment) throw new ApiError("PAYMENT_NOT_FOUND", "Không tìm thấy thanh toán.", 404);
    return payment as StoredChallengePayment;
  }

  private async expireIfNeeded(payment: StoredChallengePayment): Promise<void> {
    if (ACTIVE_STATUSES.includes(payment.status) && payment.expiresAt.getTime() <= Date.now()) {
      payment.status = "EXPIRED";
      await payment.save();
    }
  }

  private async nextOrderCode(): Promise<number> {
    let orderCode = this.store.allocateOrderCode();
    while (await this.model.exists({ orderCode })) orderCode = this.store.allocateOrderCode();
    return orderCode;
  }

  private expiryMinutes(): number {
    const value = Number(process.env.CHALLENGE_PAYMENT_EXPIRES_IN_MINUTES ?? process.env.PAYMENT_EXPIRES_IN_MINUTES ?? 15);
    return Number.isFinite(value) ? Math.min(Math.max(value, 1), 1440) : 15;
  }

  private objectId(value: string): Types.ObjectId { return Types.ObjectId.isValid(value) ? new Types.ObjectId(value) : new Types.ObjectId(); }
  private iso(value: Date | string | undefined): string { return value instanceof Date ? value.toISOString() : value ?? new Date().toISOString(); }
  private toPayment(doc: StoredChallengePayment): ChallengePayment {
    return {
      id: doc._id.toString(), userId: doc.userId.toString(), challengeId: doc.challengeId.toString(), number: doc.number,
      provider: "PAYOS", orderCode: doc.orderCode, paymentLinkId: doc.paymentLinkId, amount: doc.amount, currency: "VND",
      description: doc.description, checkoutUrl: doc.checkoutUrl, qrCode: doc.qrCode, status: doc.status as ChallengePayment["status"],
      idempotencyKey: doc.idempotencyKey, expiresAt: this.iso(doc.expiresAt), paidAt: doc.paidAt ? this.iso(doc.paidAt) : null,
      cancelledAt: doc.cancelledAt ? this.iso(doc.cancelledAt) : null, lastReconciledAt: doc.lastReconciledAt ? this.iso(doc.lastReconciledAt) : null,
      errorCode: doc.errorCode, errorMessage: doc.errorMessage, createdAt: this.iso(doc.createdAt),
    };
  }
}
