import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { SavingDayRecord, SavingPayment, SavingPlan, SavingPlanTodayResponse, SavingSlot } from "@saving/shared";
import { ApiError } from "../common/api-error";
import { localDate } from "../common/date";

@Injectable()
export class SavingPlansStore {
  readonly plans = new Map<string, SavingPlan>();
  readonly slots = new Map<string, SavingSlot>();
  readonly payments = new Map<string, SavingPayment>();
  readonly dayRecords = new Map<string, SavingDayRecord>();
  private nextOrderCode = 900000000;
  private readonly demoUser = "demo-user";

  constructor() { this.seed(); }

  seed(): void {
    if (this.plans.size) return;
    const now = new Date().toISOString();
    const plan: SavingPlan = { id: "demo-plan", userId: this.demoUser, name: "Quỹ linh hoạt 100 ngày", durationDays: 100, currentDayIndex: 13, completedDays: 12, generationMode: "CLASSIC_SEQUENCE", targetAmount: 5050000, totalSavedAmount: 820000, remainingAmount: 4230000, unitAmount: 1000, minAmount: 1000, maxAmount: 100000, stepAmount: 1000, progressMode: "FLEXIBLE_CONTRIBUTION_DAYS", confirmationMode: "PAYOS_ONLY", paymentDestinationMode: "SINGLE_OWNER_CHANNEL", paymentExpiresInMinutes: 15, timezone: "Asia/Ho_Chi_Minh", startDate: "2026-07-15", status: "ACTIVE", createdAt: now, activatedAt: now, completedAt: null };
    this.plans.set(plan.id, plan);
    for (let index = 1; index <= 100; index += 1) { const paid = index <= 12; const slot: SavingSlot = { id: `demo-slot-${index}`, userId: this.demoUser, planId: plan.id, slotIndex: index, amount: index * 1000, status: paid ? "PAID" : "AVAILABLE", reservedByPaymentId: null, reservationExpiresAt: null, assignedDayIndex: paid ? index : null, paidPaymentId: null, completedAt: paid ? now : null }; this.slots.set(slot.id, slot); }
  }

  getPlan(userId: string, planId: string): SavingPlan { const plan = this.plans.get(planId); if (!plan || plan.userId !== userId) throw new ApiError("PLAN_NOT_FOUND", "Không tìm thấy kế hoạch.", 404); return plan; }
  getSlot(userId: string, planId: string, slotId: string): SavingSlot { const slot = this.slots.get(slotId); if (!slot || slot.userId !== userId || slot.planId !== planId) throw new ApiError("SLOT_NOT_FOUND", "Không tìm thấy khoản tiền.", 404); return slot; }
  getPayment(userId: string, paymentId: string): SavingPayment { const payment = this.payments.get(paymentId); if (!payment || payment.userId !== userId) throw new ApiError("PAYMENT_NOT_FOUND", "Không tìm thấy thanh toán.", 404); return payment; }
  findPendingPayment(userId: string, planId: string, dayIndex: number): SavingPayment | null { return [...this.payments.values()].find((payment) => payment.userId === userId && payment.planId === planId && payment.dayIndex === dayIndex && ["CREATING", "PENDING", "PROCESSING"].includes(payment.status)) ?? null; }
  findByIdempotency(userId: string, key: string): SavingPayment | null { return [...this.payments.values()].find((payment) => payment.userId === userId && payment.idempotencyKey === key) ?? null; }
  allocateOrderCode(): number { this.nextOrderCode += 1; return this.nextOrderCode; }
  addPayment(payment: SavingPayment): void { this.payments.set(payment.id, payment); }

  reserveSlot(userId: string, planId: string, slotId: string, paymentId: string, expiresAt: string): SavingSlot {
    const plan = this.getPlan(userId, planId);
    if (plan.status !== "ACTIVE") throw new ApiError("PLAN_NOT_ACTIVE", "Kế hoạch chưa hoạt động.", 409);
    const slot = this.getSlot(userId, planId, slotId);
    if (slot.status !== "AVAILABLE") throw new ApiError("SLOT_NOT_AVAILABLE", "Khoản tiền này vừa được chọn hoặc đã thanh toán.", 409);
    slot.status = "RESERVED"; slot.reservedByPaymentId = paymentId; slot.reservationExpiresAt = expiresAt;
    return slot;
  }

  releaseSlot(payment: SavingPayment): void { const slot = this.slots.get(payment.slotId); if (slot && slot.status === "RESERVED" && slot.reservedByPaymentId === payment.id) { slot.status = "AVAILABLE"; slot.reservedByPaymentId = null; slot.reservationExpiresAt = null; } }

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
    const record: SavingDayRecord = { id: randomUUID(), planId: plan.id, slotId: slot.id, paymentId: payment.id, dayIndex: payment.dayIndex, amount: payment.amount, confirmationSource: "PAYOS", status: "COMPLETED", localCompletedDate: localDate(plan.timezone), completedAt: now };
    this.dayRecords.set(record.id, record);
    plan.completedDays += 1; plan.currentDayIndex = Math.min(plan.completedDays + 1, plan.durationDays); plan.totalSavedAmount += payment.amount; plan.remainingAmount -= payment.amount;
    if (plan.completedDays >= plan.durationDays) { plan.status = "COMPLETED"; plan.completedAt = now; }
    void providerReference; void transactionDateTime;
    return payment;
  }

  manuallyCompleteSlot(userId: string, planId: string, slotId: string, note: string): SavingDayRecord {
    const plan = this.getPlan(userId, planId);
    if (plan.confirmationMode !== "PAYOS_OR_MANUAL") throw new ApiError("MANUAL_CONFIRMATION_DISABLED", "Kế hoạch này chỉ xác nhận qua payOS.", 409);
    const slot = this.getSlot(userId, planId, slotId);
    if (slot.status !== "AVAILABLE") throw new ApiError("SLOT_NOT_AVAILABLE", "Khoản tiền này không còn khả dụng.", 409);
    const now = new Date().toISOString();
    slot.status = "MANUALLY_COMPLETED"; slot.assignedDayIndex = plan.currentDayIndex; slot.completedAt = now;
    const record: SavingDayRecord = { id: randomUUID(), planId, slotId, paymentId: null, dayIndex: plan.currentDayIndex, amount: slot.amount, confirmationSource: "MANUAL", status: "COMPLETED", localCompletedDate: localDate(plan.timezone), completedAt: now };
    this.dayRecords.set(record.id, record); plan.completedDays += 1; plan.currentDayIndex = Math.min(plan.completedDays + 1, plan.durationDays); plan.totalSavedAmount += slot.amount; plan.remainingAmount -= slot.amount; if (plan.completedDays >= plan.durationDays) { plan.status = "COMPLETED"; plan.completedAt = now; } void note; return record;
  }

  today(userId: string, planId: string): SavingPlanTodayResponse {
    const plan = this.getPlan(userId, planId);
    this.expirePending(plan);
    const planSlots = [...this.slots.values()].filter((slot) => slot.planId === plan.id);
    return { plan, currentDayIndex: plan.currentDayIndex, pendingPayment: this.findPendingPayment(userId, plan.id, plan.currentDayIndex), availableSlotCount: planSlots.filter((slot) => slot.status === "AVAILABLE").length, paidSlotCount: planSlots.filter((slot) => slot.status === "PAID" || slot.status === "MANUALLY_COMPLETED").length, reservedSlotCount: planSlots.filter((slot) => slot.status === "RESERVED").length };
  }

  expirePending(plan: SavingPlan): void { const now = Date.now(); for (const payment of this.payments.values()) { if (payment.planId === plan.id && ["CREATING", "PENDING", "PROCESSING"].includes(payment.status) && new Date(payment.expiresAt).getTime() <= now) { payment.status = "EXPIRED"; this.releaseSlot(payment); } } }
}
