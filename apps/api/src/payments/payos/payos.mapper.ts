import type { PayosPaymentStatus } from "./payos.types";

export function mapPayosStatus(status: unknown): PayosPaymentStatus["status"] { return status === "PAID" ? "PAID" : status === "CANCELLED" ? "CANCELLED" : status === "EXPIRED" ? "EXPIRED" : "PENDING"; }
