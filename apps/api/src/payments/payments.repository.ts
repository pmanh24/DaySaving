import { Injectable } from "@nestjs/common";
import type { SavingPayment } from "@saving/shared";
import { SavingPlansStore } from "../saving-plans/saving-plans.store";

@Injectable()
export class PaymentsRepository {
  constructor(private readonly store: SavingPlansStore) {}
  findByIdempotency(userId: string, key: string): SavingPayment | null { return this.store.findByIdempotency(userId, key); }
  findByOrderCode(orderCode: number): SavingPayment | null { return [...this.store.payments.values()].find((payment) => payment.orderCode === orderCode) ?? null; }
  add(payment: SavingPayment): void { this.store.addPayment(payment); }
  get(userId: string, paymentId: string): SavingPayment { return this.store.getPayment(userId, paymentId); }
}
