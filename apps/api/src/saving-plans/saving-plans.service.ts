import { Injectable } from "@nestjs/common";
import { Types } from "mongoose";
import type { AmountGenerationMode, SavingSlotStatus } from "@saving/shared";
import { ApiError } from "../common/api-error";
import { localDate } from "../common/date";
import { AmountGenerationInput, generateAmounts } from "./amount-generation";
import { SavingPlansStore } from "./saving-plans.store";

export interface CreatePlanInput extends AmountGenerationInput { name: string; startDate: string; timezone: string; progressMode?: "FLEXIBLE_CONTRIBUTION_DAYS" | "CALENDAR_DAYS"; confirmationMode?: "PAYOS_ONLY" | "PAYOS_OR_MANUAL"; paymentDestinationMode?: "SINGLE_OWNER_CHANNEL" | "PLATFORM_CHANNEL"; paymentExpiresInMinutes?: number; }

@Injectable()
export class SavingPlansService {
  constructor(private readonly store: SavingPlansStore) {}

  preview(input: AmountGenerationInput) { const generated = generateAmounts(input); return { ...generated, slotCount: generated.amounts.length, sample: generated.amounts.slice(0, 12) }; }

  list(userId: string) { return [...this.store.plans.values()].filter((plan) => plan.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)); }

  create(userId: string, input: CreatePlanInput) {
    const name = input.name.trim();
    if (name.length < 2 || name.length > 80) throw new ApiError("PLAN_NAME_INVALID", "Tên kế hoạch phải từ 2 đến 80 ký tự.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.startDate)) throw new ApiError("PLAN_START_DATE_INVALID", "Ngày bắt đầu không hợp lệ.");
    const today = localDate(input.timezone || "Asia/Ho_Chi_Minh");
    if (input.startDate < today) throw new ApiError("PLAN_START_DATE_INVALID", "Ngày bắt đầu không được ở quá khứ.");
    const generated = generateAmounts(input);
    const now = new Date().toISOString();
    const id = new Types.ObjectId().toString();
    const status = input.startDate === today ? "ACTIVE" : "SCHEDULED";
    const plan = { id, userId, name, durationDays: input.durationDays, currentDayIndex: 1, completedDays: 0, generationMode: input.generationMode, targetAmount: generated.targetAmount, totalSavedAmount: 0, remainingAmount: generated.targetAmount, unitAmount: input.unitAmount ?? null, minAmount: input.minAmount ?? generated.minAmount, maxAmount: input.maxAmount ?? generated.maxAmount, stepAmount: input.stepAmount ?? null, progressMode: input.progressMode ?? "FLEXIBLE_CONTRIBUTION_DAYS", confirmationMode: input.confirmationMode ?? "PAYOS_OR_MANUAL", paymentDestinationMode: input.paymentDestinationMode ?? "SINGLE_OWNER_CHANNEL", paymentExpiresInMinutes: input.paymentExpiresInMinutes ?? Number(process.env.PAYOS_DEFAULT_EXPIRE_MINUTES ?? 15), timezone: input.timezone || "Asia/Ho_Chi_Minh", startDate: input.startDate, status, createdAt: now, activatedAt: status === "ACTIVE" ? now : null, completedAt: null } as const;
    this.store.addPlan(plan);
    generated.amounts.forEach((amount, index) => { const slotId = new Types.ObjectId().toString(); this.store.addSlot({ id: slotId, userId, planId: id, slotIndex: index + 1, amount, status: "AVAILABLE", reservedByPaymentId: null, reservationExpiresAt: null, assignedDayIndex: null, paidPaymentId: null, completedAt: null }); });
    return { plan, slotCount: generated.amounts.length };
  }

  start(userId: string, planId: string) { const plan = this.store.getPlan(userId, planId); if (plan.status === "COMPLETED") throw new ApiError("PLAN_COMPLETED", "Kế hoạch đã hoàn thành.", 409); plan.status = "ACTIVE"; plan.activatedAt ??= new Date().toISOString(); this.store.savePlan(plan); return plan; }
  remove(userId: string, planId: string) { return this.store.deletePlan(userId, planId); }
  get(userId: string, planId: string) { return this.store.getPlan(userId, planId); }
  today(userId: string, planId: string) { return this.store.today(userId, planId); }
  slots(userId: string, planId: string, status?: SavingSlotStatus, minAmount?: number, maxAmount?: number, sort = "asc", page = 1, limit = 60) { this.store.getPlan(userId, planId); let items = [...this.store.slots.values()].filter((slot) => slot.userId === userId && slot.planId === planId && (!status || slot.status === status) && (minAmount === undefined || slot.amount >= minAmount) && (maxAmount === undefined || slot.amount <= maxAmount)); items.sort((a, b) => sort === "desc" ? b.amount - a.amount : a.amount - b.amount || a.slotIndex - b.slotIndex); const safeLimit = Math.min(Math.max(limit, 1), 300); const start = Math.max(page - 1, 0) * safeLimit; return { items: items.slice(start, start + safeLimit), meta: { page, limit: safeLimit, total: items.length, totalPages: Math.ceil(items.length / safeLimit) } }; }
  slotStatistics(userId: string, planId: string) { this.store.getPlan(userId, planId); const slots = [...this.store.slots.values()].filter((slot) => slot.userId === userId && slot.planId === planId); const count = (items: typeof slots) => items.length; const sum = (items: typeof slots) => items.reduce((total, slot) => total + slot.amount, 0); return { totalSlots: count(slots), paidSlots: count(slots.filter((slot) => slot.status === "PAID" || slot.status === "MANUALLY_COMPLETED")), pendingSlots: count(slots.filter((slot) => slot.status === "RESERVED")), availableSlots: count(slots.filter((slot) => slot.status === "AVAILABLE")), totalSaved: sum(slots.filter((slot) => slot.status === "PAID" || slot.status === "MANUALLY_COMPLETED")), totalRemaining: sum(slots.filter((slot) => slot.status === "AVAILABLE" || slot.status === "RESERVED")), groupedByAmount: this.groupByAmount(slots) }; }
  records(userId: string, planId: string) { this.store.getPlan(userId, planId); return [...this.store.dayRecords.values()].filter((record) => record.planId === planId && this.store.plans.get(planId)?.userId === userId).sort((a, b) => b.dayIndex - a.dayIndex); }
  manualComplete(userId: string, planId: string, slotId: string, note = "") { if (note.length > 200) throw new ApiError("VALIDATION_ERROR", "Ghi chú không được vượt quá 200 ký tự."); return this.store.manuallyCompleteSlot(userId, planId, slotId, note); }
  private groupByAmount(slots: Array<{ amount: number; status: string }>) { const groups = new Map<number, { amount: number; available: number; paid: number; reserved: number }>(); for (const slot of slots) { const current = groups.get(slot.amount) ?? { amount: slot.amount, available: 0, paid: 0, reserved: 0 }; if (slot.status === "AVAILABLE") current.available += 1; else if (slot.status === "RESERVED") current.reserved += 1; else current.paid += 1; groups.set(slot.amount, current); } return [...groups.values()].sort((a, b) => a.amount - b.amount); }
}
