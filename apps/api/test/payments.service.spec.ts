import { PaymentsService } from "../src/payments/payments.service";
import { PayosService } from "../src/payments/payos/payos.service";
import { SavingPlansStore } from "../src/saving-plans/saving-plans.store";
import { SavingPlansService } from "../src/saving-plans/saving-plans.service";
import { PaymentsRepository } from "../src/payments/payments.repository";
import { localDate } from "../src/common/date";

describe("PaymentsService", () => {
  it("only completes a day after a verified webhook and is idempotent", async () => {
    const store = new SavingPlansStore();
    const plans = new SavingPlansService(store);
    const userId = "user-1";
    const created = plans.create(userId, { name: "Kế hoạch kiểm thử", durationDays: 2, generationMode: "CLASSIC_SEQUENCE", unitAmount: 1000, startDate: localDate("Asia/Ho_Chi_Minh"), timezone: "Asia/Ho_Chi_Minh" });
    const slot = [...store.slots.values()].find((item) => item.planId === created.plan.id && item.status === "AVAILABLE");
    expect(slot).toBeDefined();
    const payments = new PaymentsService(store, new PayosService(), new PaymentsRepository(store));
    const payment = await payments.create(userId, { planId: created.plan.id, slotId: slot!.id, idempotencyKey: "550e8400-e29b-41d4-a716-446655440099" });
    expect(payment.status).toBe("PENDING");
    expect(store.plans.get(created.plan.id)?.completedDays).toBe(0);
    const payload = { success: true, data: { code: "00", orderCode: payment.orderCode, amount: payment.amount, paymentLinkId: payment.paymentLinkId, reference: "REF-1", transactionDateTime: "2026-07-27 10:00:00" }, signature: "local" };
    const confirmed = await payments.webhook(payload);
    expect(confirmed.status).toBe("PROCESSED");
    expect(store.payments.get(payment.id)?.status).toBe("PAID");
    expect(store.slots.get(slot!.id)?.status).toBe("PAID");
    expect(store.plans.get(created.plan.id)?.completedDays).toBe(1);
    const duplicate = await payments.webhook(payload);
    expect(duplicate.status).toBe("IGNORED_DUPLICATE");
    expect(store.plans.get(created.plan.id)?.completedDays).toBe(1);
  });
});
