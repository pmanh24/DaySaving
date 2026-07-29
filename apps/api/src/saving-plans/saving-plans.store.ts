import { Injectable, Optional } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Types, type Model } from "mongoose";
import type { SavingDayRecord, SavingPayment, SavingPlan, SavingPlanTodayResponse, SavingSlot } from "@saving/shared";
import { ApiError } from "../common/api-error";
import { localDate } from "../common/date";
import { CounterDocument, SavingDayRecordDocument, SavingPaymentDocument, SavingPlanDocument, SavingSlotDocument } from "../database/schemas";

@Injectable()
export class SavingPlansStore {
  readonly plans = new Map<string, SavingPlan>();
  readonly slots = new Map<string, SavingSlot>();
  readonly payments = new Map<string, SavingPayment>();
  readonly dayRecords = new Map<string, SavingDayRecord>();
  private nextOrderCode = 900000000;

  constructor(
    @Optional() @InjectModel(SavingPlanDocument.name) private readonly planModel?: Model<SavingPlanDocument>,
    @Optional() @InjectModel(SavingSlotDocument.name) private readonly slotModel?: Model<SavingSlotDocument>,
    @Optional() @InjectModel(SavingPaymentDocument.name) private readonly paymentModel?: Model<SavingPaymentDocument>,
    @Optional() @InjectModel(SavingDayRecordDocument.name) private readonly recordModel?: Model<SavingDayRecordDocument>,
    @Optional() @InjectModel(CounterDocument.name) private readonly counterModel?: Model<CounterDocument>,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.planModel || !this.slotModel || !this.paymentModel || !this.recordModel) return;
    const [plans, slots, payments, records, counter] = await Promise.all([
      this.planModel.find().exec(),
      this.slotModel.find().exec(),
      this.paymentModel.find().exec(),
      this.recordModel.find().exec(),
      this.counterModel?.findById("payos_order_code").lean().exec() ?? Promise.resolve(null),
    ]);
    for (const doc of plans) this.plans.set(doc._id.toString(), this.planFromDocument(doc));
    for (const doc of slots) this.slots.set(doc._id.toString(), this.slotFromDocument(doc));
    for (const doc of payments) { const payment = this.paymentFromDocument(doc); this.payments.set(payment.id, payment); this.nextOrderCode = Math.max(this.nextOrderCode, payment.orderCode); }
    for (const doc of records) this.dayRecords.set(doc._id.toString(), this.recordFromDocument(doc));
    if (counter?.sequenceValue) this.nextOrderCode = Math.max(this.nextOrderCode, counter.sequenceValue);
  }

  addPlan(plan: SavingPlan): void { this.plans.set(plan.id, plan); void this.persistPlan(plan); }
  addSlot(slot: SavingSlot): void { this.slots.set(slot.id, slot); void this.persistSlot(slot); }

  getPlan(userId: string, planId: string): SavingPlan { const plan = this.plans.get(planId); if (!plan || plan.userId !== userId) throw new ApiError("PLAN_NOT_FOUND", "Không tìm thấy kế hoạch.", 404); return plan; }
  getSlot(userId: string, planId: string, slotId: string): SavingSlot { const slot = this.slots.get(slotId); if (!slot || slot.userId !== userId || slot.planId !== planId) throw new ApiError("SLOT_NOT_FOUND", "Không tìm thấy khoản tiền.", 404); return slot; }
  getPayment(userId: string, paymentId: string): SavingPayment { const payment = this.payments.get(paymentId); if (!payment || payment.userId !== userId) throw new ApiError("PAYMENT_NOT_FOUND", "Không tìm thấy thanh toán.", 404); return payment; }
  findPendingPayment(userId: string, planId: string, dayIndex: number): SavingPayment | null { return [...this.payments.values()].find((payment) => payment.userId === userId && payment.planId === planId && payment.dayIndex === dayIndex && ["CREATING", "PENDING", "PROCESSING"].includes(payment.status)) ?? null; }
  findByIdempotency(userId: string, key: string): SavingPayment | null { return [...this.payments.values()].find((payment) => payment.userId === userId && payment.idempotencyKey === key) ?? null; }
  async allocateOrderCode(): Promise<number> {
    if (this.counterModel) {
      const now = new Date();
      const counter = await this.counterModel.findOneAndUpdate(
        { _id: "payos_order_code" },
        [
          {
            $set: {
              sequenceValue: { $add: [{ $ifNull: ["$sequenceValue", 100000] }, 1] },
              createdAt: { $ifNull: ["$createdAt", now] },
              updatedAt: now,
            },
          },
        ],
        { upsert: true, new: true },
      ).lean().exec();
      if (counter?.sequenceValue) {
        this.nextOrderCode = Math.max(this.nextOrderCode, counter.sequenceValue);
        return counter.sequenceValue;
      }
    }
    this.nextOrderCode += 1;
    return this.nextOrderCode;
  }
  addPayment(payment: SavingPayment): void { this.payments.set(payment.id, payment); void this.persistPayment(payment); }

  reserveSlot(userId: string, planId: string, slotId: string, paymentId: string, expiresAt: string): SavingSlot {
    const plan = this.getPlan(userId, planId);
    if (plan.status !== "ACTIVE") throw new ApiError("PLAN_NOT_ACTIVE", "Kế hoạch chưa hoạt động.", 409);
    const slot = this.getSlot(userId, planId, slotId);
    if (slot.status !== "AVAILABLE") throw new ApiError("SLOT_NOT_AVAILABLE", "Khoản tiền này vừa được chọn hoặc đã thanh toán.", 409);
    slot.status = "RESERVED"; slot.reservedByPaymentId = paymentId; slot.reservationExpiresAt = expiresAt;
    void this.persistSlot(slot);
    return slot;
  }

  releaseSlot(payment: SavingPayment): void { const slot = this.slots.get(payment.slotId); if (slot && slot.status === "RESERVED" && slot.reservedByPaymentId === payment.id) { slot.status = "AVAILABLE"; slot.reservedByPaymentId = null; slot.reservationExpiresAt = null; void this.persistSlot(slot); } }

  confirmSuccessfulPayment(userId: string, paymentId: string, providerAmount: number, providerReference: string | null, transactionDateTime: string | null): SavingPayment {
    const payment = this.getPayment(userId, paymentId);
    if (payment.status === "PAID") return payment;
    if (payment.amount !== providerAmount) throw new ApiError("PAYMENT_AMOUNT_MISMATCH", "Số tiền thanh toán không khớp khoản đã chọn.", 409);
    const plan = this.getPlan(userId, payment.planId);
    const slot = this.getSlot(userId, payment.planId, payment.slotId);
    if (slot.status !== "RESERVED" || slot.reservedByPaymentId !== payment.id) throw new ApiError("SLOT_NOT_AVAILABLE", "Khoản tiền không còn được giữ cho thanh toán này.", 409);
    if (plan.status !== "ACTIVE") throw new ApiError("PLAN_NOT_ACTIVE", "Kế hoạch không còn hoạt động.", 409);
    const now = new Date().toISOString();
    payment.status = "PAID"; payment.paidAt = now; payment.lastReconciledAt = now; payment.errorCode = null; payment.errorMessage = null;
    slot.status = "PAID"; slot.paidPaymentId = payment.id; slot.assignedDayIndex = payment.dayIndex; slot.reservedByPaymentId = null; slot.reservationExpiresAt = null; slot.completedAt = now;
    const record: SavingDayRecord = { id: new Types.ObjectId().toString(), planId: plan.id, slotId: slot.id, paymentId: payment.id, dayIndex: payment.dayIndex, amount: payment.amount, confirmationSource: "PAYOS", status: "COMPLETED", localCompletedDate: localDate(plan.timezone), completedAt: now };
    this.dayRecords.set(record.id, record);
    plan.completedDays += 1; plan.currentDayIndex = Math.min(plan.completedDays + 1, plan.durationDays); plan.totalSavedAmount += payment.amount; plan.remainingAmount -= payment.amount;
    if (plan.completedDays >= plan.durationDays) { plan.status = "COMPLETED"; plan.completedAt = now; }
    void this.persistPayment(payment, providerReference, transactionDateTime); void this.persistSlot(slot); void this.persistPlan(plan); void this.persistRecord(record, userId);
    return payment;
  }

  manuallyCompleteSlot(userId: string, planId: string, slotId: string, note: string): SavingDayRecord {
    const plan = this.getPlan(userId, planId);
    if (plan.confirmationMode !== "PAYOS_OR_MANUAL") throw new ApiError("MANUAL_CONFIRMATION_DISABLED", "Kế hoạch này chỉ xác nhận qua payOS.", 409);
    const slot = this.getSlot(userId, planId, slotId);
    if (slot.status !== "AVAILABLE") throw new ApiError("SLOT_NOT_AVAILABLE", "Khoản tiền này không còn khả dụng.", 409);
    const now = new Date().toISOString();
    slot.status = "MANUALLY_COMPLETED"; slot.assignedDayIndex = plan.currentDayIndex; slot.completedAt = now;
    const record: SavingDayRecord = { id: new Types.ObjectId().toString(), planId, slotId, paymentId: null, dayIndex: plan.currentDayIndex, amount: slot.amount, confirmationSource: "MANUAL", status: "COMPLETED", localCompletedDate: localDate(plan.timezone), completedAt: now };
    this.dayRecords.set(record.id, record); plan.completedDays += 1; plan.currentDayIndex = Math.min(plan.completedDays + 1, plan.durationDays); plan.totalSavedAmount += slot.amount; plan.remainingAmount -= slot.amount; if (plan.completedDays >= plan.durationDays) { plan.status = "COMPLETED"; plan.completedAt = now; } void this.persistSlot(slot); void this.persistPlan(plan); void this.persistRecord(record, userId); void note; return record;
  }

  today(userId: string, planId: string): SavingPlanTodayResponse {
    const plan = this.getPlan(userId, planId);
    this.expirePending(plan);
    const planSlots = [...this.slots.values()].filter((slot) => slot.planId === plan.id);
    return { plan, currentDayIndex: plan.currentDayIndex, pendingPayment: this.findPendingPayment(userId, plan.id, plan.currentDayIndex), availableSlotCount: planSlots.filter((slot) => slot.status === "AVAILABLE").length, paidSlotCount: planSlots.filter((slot) => slot.status === "PAID" || slot.status === "MANUALLY_COMPLETED").length, reservedSlotCount: planSlots.filter((slot) => slot.status === "RESERVED").length };
  }

  expirePending(plan: SavingPlan): void { const now = Date.now(); for (const payment of this.payments.values()) { if (payment.planId === plan.id && ["CREATING", "PENDING", "PROCESSING"].includes(payment.status) && new Date(payment.expiresAt).getTime() <= now) { payment.status = "EXPIRED"; void this.persistPayment(payment); this.releaseSlot(payment); } } }

  private objectId(value: string): Types.ObjectId { return Types.ObjectId.isValid(value) ? new Types.ObjectId(value) : new Types.ObjectId(); }
  private iso(value: Date | string | undefined): string { return value instanceof Date ? value.toISOString() : value ?? new Date().toISOString(); }
  private date(value: string | null): Date | null { return value ? new Date(value) : null; }
  private async persistPlan(plan: SavingPlan): Promise<void> { if (!this.planModel) return; await this.planModel.updateOne({ _id: this.objectId(plan.id) }, { $set: { userId: this.objectId(plan.userId), name: plan.name, durationDays: plan.durationDays, currentDayIndex: plan.currentDayIndex, completedDays: plan.completedDays, generationMode: plan.generationMode, targetAmount: plan.targetAmount, totalSavedAmount: plan.totalSavedAmount, remainingAmount: plan.remainingAmount, unitAmount: plan.unitAmount, minAmount: plan.minAmount, maxAmount: plan.maxAmount, stepAmount: plan.stepAmount, progressMode: plan.progressMode, confirmationMode: plan.confirmationMode, paymentDestinationMode: plan.paymentDestinationMode, paymentExpiresInMinutes: plan.paymentExpiresInMinutes, timezone: plan.timezone, startDate: new Date(plan.startDate), status: plan.status, activatedAt: this.date(plan.activatedAt), completedAt: this.date(plan.completedAt) } }, { upsert: true }).exec(); }
  private async persistSlot(slot: SavingSlot): Promise<void> { if (!this.slotModel) return; await this.slotModel.updateOne({ _id: this.objectId(slot.id) }, { $set: { userId: this.objectId(slot.userId), planId: this.objectId(slot.planId), slotIndex: slot.slotIndex, amount: slot.amount, status: slot.status, reservedByPaymentId: slot.reservedByPaymentId ? this.objectId(slot.reservedByPaymentId) : null, reservationExpiresAt: this.date(slot.reservationExpiresAt), assignedDayIndex: slot.assignedDayIndex, paidPaymentId: slot.paidPaymentId ? this.objectId(slot.paidPaymentId) : null, completedAt: this.date(slot.completedAt) } }, { upsert: true }).exec(); }
  private async persistPayment(payment: SavingPayment, providerReference: string | null = null, transactionDateTime: string | null = null): Promise<void> { if (!this.paymentModel) return; await this.paymentModel.updateOne({ _id: this.objectId(payment.id) }, { $set: { userId: this.objectId(payment.userId), planId: this.objectId(payment.planId), slotId: this.objectId(payment.slotId), dayIndex: payment.dayIndex, provider: payment.provider, orderCode: payment.orderCode, paymentLinkId: payment.paymentLinkId, amount: payment.amount, currency: payment.currency, description: payment.description, checkoutUrl: payment.checkoutUrl, qrCode: payment.qrCode, status: payment.status, idempotencyKey: payment.idempotencyKey, expiresAt: new Date(payment.expiresAt), paidAt: this.date(payment.paidAt), cancelledAt: this.date(payment.cancelledAt), lastReconciledAt: this.date(payment.lastReconciledAt), providerReference, transactionDateTime, errorCode: payment.errorCode, errorMessage: payment.errorMessage } }, { upsert: true }).exec(); }
  private async persistRecord(record: SavingDayRecord, userId: string): Promise<void> { if (!this.recordModel) return; await this.recordModel.updateOne({ _id: this.objectId(record.id) }, { $set: { userId: this.objectId(userId), planId: this.objectId(record.planId), slotId: this.objectId(record.slotId), paymentId: record.paymentId ? this.objectId(record.paymentId) : null, dayIndex: record.dayIndex, amount: record.amount, confirmationSource: record.confirmationSource, status: record.status, localCompletedDate: record.localCompletedDate, completedAt: new Date(record.completedAt) } }, { upsert: true }).exec(); }
  private planFromDocument(doc: SavingPlanDocument & { _id: Types.ObjectId; createdAt?: Date; }): SavingPlan { return { id: doc._id.toString(), userId: doc.userId.toString(), name: doc.name, durationDays: doc.durationDays, currentDayIndex: doc.currentDayIndex, completedDays: doc.completedDays, generationMode: doc.generationMode as SavingPlan["generationMode"], targetAmount: doc.targetAmount, totalSavedAmount: doc.totalSavedAmount, remainingAmount: doc.remainingAmount, unitAmount: doc.unitAmount, minAmount: doc.minAmount, maxAmount: doc.maxAmount, stepAmount: doc.stepAmount, progressMode: doc.progressMode as SavingPlan["progressMode"], confirmationMode: doc.confirmationMode as SavingPlan["confirmationMode"], paymentDestinationMode: doc.paymentDestinationMode as SavingPlan["paymentDestinationMode"], paymentExpiresInMinutes: doc.paymentExpiresInMinutes, timezone: doc.timezone, startDate: this.iso(doc.startDate), status: doc.status as SavingPlan["status"], createdAt: this.iso(doc.createdAt), activatedAt: doc.activatedAt ? this.iso(doc.activatedAt) : null, completedAt: doc.completedAt ? this.iso(doc.completedAt) : null }; }
  private slotFromDocument(doc: SavingSlotDocument & { _id: Types.ObjectId; }): SavingSlot { return { id: doc._id.toString(), userId: doc.userId.toString(), planId: doc.planId.toString(), slotIndex: doc.slotIndex, amount: doc.amount, status: doc.status as SavingSlot["status"], reservedByPaymentId: doc.reservedByPaymentId?.toString() ?? null, reservationExpiresAt: doc.reservationExpiresAt ? this.iso(doc.reservationExpiresAt) : null, assignedDayIndex: doc.assignedDayIndex, paidPaymentId: doc.paidPaymentId?.toString() ?? null, completedAt: doc.completedAt ? this.iso(doc.completedAt) : null }; }
  private paymentFromDocument(doc: SavingPaymentDocument & { _id: Types.ObjectId; }): SavingPayment { return { id: doc._id.toString(), userId: doc.userId.toString(), planId: doc.planId.toString(), slotId: doc.slotId.toString(), dayIndex: doc.dayIndex, provider: "PAYOS", orderCode: doc.orderCode, paymentLinkId: doc.paymentLinkId, amount: doc.amount, currency: "VND", description: doc.description, checkoutUrl: doc.checkoutUrl, qrCode: doc.qrCode, status: doc.status as SavingPayment["status"], idempotencyKey: doc.idempotencyKey, expiresAt: this.iso(doc.expiresAt), paidAt: doc.paidAt ? this.iso(doc.paidAt) : null, cancelledAt: doc.cancelledAt ? this.iso(doc.cancelledAt) : null, lastReconciledAt: doc.lastReconciledAt ? this.iso(doc.lastReconciledAt) : null, errorCode: doc.errorCode, errorMessage: doc.errorMessage, createdAt: this.iso((doc as unknown as { createdAt?: Date }).createdAt) }; }
  private recordFromDocument(doc: SavingDayRecordDocument & { _id: Types.ObjectId; }): SavingDayRecord { return { id: doc._id.toString(), planId: doc.planId.toString(), slotId: doc.slotId.toString(), paymentId: doc.paymentId?.toString() ?? null, dayIndex: doc.dayIndex, amount: doc.amount, confirmationSource: doc.confirmationSource as SavingDayRecord["confirmationSource"], status: doc.status as SavingDayRecord["status"], localCompletedDate: doc.localCompletedDate, completedAt: this.iso(doc.completedAt) }; }
}
