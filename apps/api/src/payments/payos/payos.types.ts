export interface CreatePayosPaymentInput { orderCode: number; amount: number; description: string; returnUrl: string; cancelUrl: string; expiredAt: number; }
export interface CreatedPayosPayment { paymentLinkId: string | null; checkoutUrl: string | null; qrCode: string | null; status: "PENDING"; }
export interface VerifiedPayosPayment { orderCode: number; amount: number; paymentLinkId: string | null; reference: string | null; transactionDateTime: string | null; code: string; }
export interface PayosPaymentStatus { status: "PAID" | "PENDING" | "CANCELLED" | "EXPIRED"; amount: number; reference: string | null; transactionDateTime: string | null; }
