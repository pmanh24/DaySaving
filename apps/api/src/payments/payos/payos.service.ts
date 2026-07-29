import { Injectable, Logger } from "@nestjs/common";
import { PayOS } from "@payos/node";
import { ApiError } from "../../common/api-error";
import type { CreatePayosPaymentInput, CreatedPayosPayment, PayosPaymentStatus, VerifiedPayosPayment } from "./payos.types";
import { mapPayosStatus } from "./payos.mapper";

@Injectable()
export class PayosService {
  private readonly logger = new Logger(PayosService.name);
  private readonly client: PayOS | null;
  constructor() { const { PAYOS_CLIENT_ID: clientId, PAYOS_API_KEY: apiKey, PAYOS_CHECKSUM_KEY: checksumKey } = process.env; this.client = clientId && apiKey && checksumKey ? new PayOS({ clientId, apiKey, checksumKey }) : null; }

  get isConfigured(): boolean { return this.client !== null; }

  async createPaymentLink(input: CreatePayosPaymentInput): Promise<CreatedPayosPayment> {
    if (!this.client) return { paymentLinkId: `mock-${input.orderCode}`, checkoutUrl: `${process.env.PAYOS_RETURN_URL ?? "http://localhost:3000/payment/return"}?orderCode=${input.orderCode}&mockStatus=PENDING`, qrCode: `mock-payos:${input.orderCode}:${input.amount}`, status: "PENDING" };
    const result = await this.client.paymentRequests.create(input);
    return { paymentLinkId: result.paymentLinkId ?? null, checkoutUrl: result.checkoutUrl ?? null, qrCode: result.qrCode ?? null, status: "PENDING" };
  }

  async verifyWebhook(payload: unknown): Promise<VerifiedPayosPayment> {
    if (!this.client) {
      if (process.env.NODE_ENV === "production") throw new ApiError("PAYOS_SIGNATURE_INVALID", "Không thể xác minh webhook payOS.", 400);
      const root = this.object(payload); const data = this.object(root.data); const orderCode = Number(data.orderCode); const amount = Number(data.amount); if (!Number.isInteger(orderCode) || !Number.isInteger(amount)) throw new ApiError("PAYOS_SIGNATURE_INVALID", "Payload webhook local không hợp lệ.", 400); return { orderCode, amount, paymentLinkId: typeof data.paymentLinkId === "string" ? data.paymentLinkId : null, reference: typeof data.reference === "string" ? data.reference : null, transactionDateTime: typeof data.transactionDateTime === "string" ? data.transactionDateTime : null, code: typeof data.code === "string" ? data.code : (root.success === true ? "00" : "01") };
    }
    const verifier = this.client.webhooks.verify as unknown as (input: unknown) => Promise<unknown>;
    const verified = this.object(await verifier(payload)); const data = typeof verified.orderCode === "number" ? verified : this.object(verified.data); return { orderCode: Number(data.orderCode), amount: Number(data.amount), paymentLinkId: typeof data.paymentLinkId === "string" ? data.paymentLinkId : null, reference: typeof data.reference === "string" ? data.reference : null, transactionDateTime: typeof data.transactionDateTime === "string" ? data.transactionDateTime : null, code: typeof data.code === "string" ? data.code : "00" };
  }

  async getPaymentStatus(orderCode: number): Promise<PayosPaymentStatus> {
    if (!this.client) return { status: "PENDING", amount: 0, reference: null, transactionDateTime: null };
    const getter = (this.client.paymentRequests as unknown as { get?: (orderCode: number) => Promise<unknown> }).get;
    if (!getter) return { status: "PENDING", amount: 0, reference: null, transactionDateTime: null };
    const result = this.object(await getter.call(this.client.paymentRequests, orderCode)); const status = mapPayosStatus(result.status); const transactions = Array.isArray(result.transactions) ? result.transactions : []; const transaction = transactions.length && typeof transactions[0] === "object" && transactions[0] !== null ? transactions[0] as Record<string, unknown> : {}; return { status, amount: Number(result.amountPaid ?? result.amount ?? transaction.amount ?? 0), reference: typeof transaction.reference === "string" ? transaction.reference : null, transactionDateTime: typeof transaction.transactionDateTime === "string" ? transaction.transactionDateTime : null };
  }

  async cancelPayment(paymentLinkId: string | null): Promise<void> { if (!this.client || !paymentLinkId) return; const cancel = (this.client.paymentRequests as unknown as { cancel?: (id: string) => Promise<unknown> }).cancel; if (cancel) await cancel.call(this.client.paymentRequests, paymentLinkId); }
  logProviderFailure(error: unknown): void { this.logger.warn(error instanceof Error ? error.message : "payOS provider error"); }
  private object(value: unknown): Record<string, unknown> { if (!value || typeof value !== "object") throw new ApiError("PAYOS_SIGNATURE_INVALID", "Payload payOS không hợp lệ.", 400); return value as Record<string, unknown>; }
}
