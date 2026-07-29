import { Body, Controller, Inject, Post, forwardRef } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { PaymentsService } from "../payments.service";
import { ChallengePaymentsService } from "../challenge-payments.service";

@ApiTags("payos")
@Controller("integrations/payos")
export class PayosWebhookController {
  constructor(private readonly payments: PaymentsService, @Inject(forwardRef(() => ChallengePaymentsService)) private readonly challengePayments: ChallengePaymentsService) {}
  @Post("webhook") async webhook(@Body() payload: unknown) {
    const root = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
    const data = root.data && typeof root.data === "object" ? root.data as Record<string, unknown> : {};
    const orderCode = Number(data.orderCode);
    const result = Number.isInteger(orderCode) && await this.challengePayments.hasOrderCode(orderCode)
      ? await this.challengePayments.webhook(payload)
      : await this.payments.webhook(payload);
    return { success: true, data: result };
  }
}
