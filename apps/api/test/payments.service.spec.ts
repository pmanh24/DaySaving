import { PaymentsService } from "../src/payments/payments.service";
import { PayosService } from "../src/payments/payos/payos.service";
import { SavingPlansStore } from "../src/saving-plans/saving-plans.store";
import { PaymentsRepository } from "../src/payments/payments.repository";

describe("PaymentsService", () => {
  it("only completes a day after a verified webhook and is idempotent", async () => {
    const store = new SavingPlansStore();
    const payments = new PaymentsService(store, new PayosService(), new PaymentsRepository(store));
    const slot = [...store.slots.values()].find((item) => item.status === "AVAILABLE");
    expect(slot).toBeDefined();
    const payment = await payments.create("demo-user", { planId: "demo-plan", slotId: slot!.id, idempotencyKey: "550e8400-e29b-41d4-a716-446655440099" });
    expect(payment.status).toBe("PENDING");
    expect(store.plans.get("demo-plan")?.completedDays).toBe(12);
    const payload = { success: true, data: { code: "00", orderCode: payment.orderCode, amount: payment.amount, paymentLinkId: payment.paymentLinkId, reference: "REF-1", transactionDateTime: "2026-07-27 10:00:00" }, signature: "local" };
    const confirmed = await payments.webhook(payload);
    expect(confirmed.status).toBe("PROCESSED");
    expect(store.payments.get(payment.id)?.status).toBe("PAID");
    expect(store.slots.get(slot!.id)?.status).toBe("PAID");
    expect(store.plans.get("demo-plan")?.completedDays).toBe(13);
    const duplicate = await payments.webhook(payload);
    expect(duplicate.status).toBe("IGNORED_DUPLICATE");
    expect(store.plans.get("demo-plan")?.completedDays).toBe(13);
  });
});
