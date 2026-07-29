import { Injectable } from "@nestjs/common";
import { Types } from "mongoose";
import type { SavingPayment } from "@saving/shared";
import { ApiError } from "../common/api-error";
import { SavingPlansStore } from "../saving-plans/saving-plans.store";
import { PaymentsRepository } from "./payments.repository";
import { PayosService } from "./payos/payos.service";

interface CreatePaymentInput { planId: string; slotId: string; idempotencyKey: string; }

@Injectable()
export class PaymentsService {
  constructor(private readonly store: SavingPlansStore, private readonly payos: PayosService, private readonly repository: PaymentsRepository) {}

  async create(userId: string, input: CreatePaymentInput): Promise<SavingPayment> {
    const existing = this.repository.findByIdempotency(userId, input.idempotencyKey);
    if (existing) { if (existing.planId !== input.planId || existing.slotId !== input.slotId) throw new ApiError("IDEMPOTENCY_CONFLICT", "Idempotency key đã được dùng cho yêu cầu khác.", 409); return existing; }
    const plan = this.store.getPlan(userId, input.planId);
    const pending = this.store.findPendingPayment(userId, plan.id, plan.currentDayIndex);
    if (pending) { if (pending.slotId === input.slotId) return pending; throw new ApiError("PAYMENT_ALREADY_PENDING", "Bạn đang có một khoản chờ thanh toán trong ngày này.", 409); }
    const slot = this.store.getSlot(userId, plan.id, input.slotId);
    const now = new Date(); const expiresAt = new Date(now.getTime() + plan.paymentExpiresInMinutes * 60000).toISOString(); const paymentId = new Types.ObjectId().toString();
    const orderCode = await this.store.allocateOrderCode();
    const payment: SavingPayment = { id: paymentId, userId, planId: plan.id, slotId: slot.id, dayIndex: plan.currentDayIndex, provider: "PAYOS", orderCode, paymentLinkId: null, amount: slot.amount, currency: "VND", description: `TK${orderCode}`, checkoutUrl: null, qrCode: null, status: "CREATING", idempotencyKey: input.idempotencyKey, expiresAt, paidAt: null, cancelledAt: null, lastReconciledAt: null, errorCode: null, errorMessage: null, createdAt: now.toISOString() };
    this.repository.add(payment);
    this.store.reserveSlot(userId, plan.id, slot.id, payment.id, expiresAt);
    try {
      const provider = await this.payos.createPaymentLink({ orderCode: payment.orderCode, amount: payment.amount, description: payment.description, returnUrl: process.env.PAYOS_RETURN_URL ?? "http://localhost:3000/payment/return", cancelUrl: process.env.PAYOS_CANCEL_URL ?? "http://localhost:3000/payment/cancel", expiredAt: Math.floor(new Date(expiresAt).getTime() / 1000) });
      payment.status = "PENDING"; payment.paymentLinkId = provider.paymentLinkId; payment.checkoutUrl = provider.checkoutUrl; payment.qrCode = provider.qrCode; this.repository.save(payment);
      return payment;
    } catch (error) { payment.status = "FAILED"; payment.errorCode = "PAYMENT_CREATE_FAILED"; payment.errorMessage = "Không thể tạo mã thanh toán."; this.repository.save(payment); this.store.releaseSlot(payment); this.payos.logProviderFailure(error); throw new ApiError("PAYMENT_CREATE_FAILED", "Không thể tạo mã thanh toán.", 502); }
  }

  get(userId: string, paymentId: string): SavingPayment { const payment = this.repository.get(userId, paymentId); this.expireIfNeeded(payment); return payment; }
  async reconcile(userId: string, paymentId: string): Promise<SavingPayment> { const payment = this.store.getPayment(userId, paymentId); this.expireIfNeeded(payment); if (["PAID", "CANCELLED", "EXPIRED", "FAILED"].includes(payment.status)) return payment; const provider = await this.payos.getPaymentStatus(payment.orderCode); payment.lastReconciledAt = new Date().toISOString(); if (provider.status === "PAID") return this.store.confirmSuccessfulPayment(userId, payment.id, provider.amount || payment.amount, provider.reference, provider.transactionDateTime); if (provider.status === "CANCELLED") { payment.status = "CANCELLED"; payment.cancelledAt = new Date().toISOString(); this.store.releaseSlot(payment); } if (provider.status === "EXPIRED") { payment.status = "EXPIRED"; this.store.releaseSlot(payment); } this.repository.save(payment); return payment; }
  async cancel(userId: string, paymentId: string): Promise<SavingPayment> { const payment = this.store.getPayment(userId, paymentId); if (payment.status === "PAID") throw new ApiError("PAYMENT_ALREADY_PAID", "Không thể hủy thanh toán đã hoàn tất.", 409); if (["CANCELLED", "EXPIRED", "FAILED"].includes(payment.status)) return payment; await this.payos.cancelPayment(payment.paymentLinkId); payment.status = "CANCELLED"; payment.cancelledAt = new Date().toISOString(); this.store.releaseSlot(payment); this.repository.save(payment); return payment; }
  async webhook(payload: unknown): Promise<{ status: string; payment: SavingPayment | null }> { const verified = await this.payos.verifyWebhook(payload); const payment = this.repository.findByOrderCode(verified.orderCode); if (!payment) throw new ApiError("PAYOS_ORDER_NOT_FOUND", "Không tìm thấy orderCode.", 404); if (payment.status === "PAID") return { status: "IGNORED_DUPLICATE", payment }; if (verified.code !== "00") return { status: "RECEIVED", payment }; return { status: "PROCESSED", payment: this.store.confirmSuccessfulPayment(payment.userId, payment.id, verified.amount, verified.reference, verified.transactionDateTime) }; }
  private expireIfNeeded(payment: SavingPayment): void { if (["CREATING", "PENDING", "PROCESSING"].includes(payment.status) && new Date(payment.expiresAt).getTime() <= Date.now()) { payment.status = "EXPIRED"; this.store.releaseSlot(payment); this.repository.save(payment); } }
}
