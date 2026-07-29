import { Body, Controller, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { PaymentsService } from "../payments.service";

@ApiTags("payos")
@Controller("integrations/payos")
export class PayosWebhookController {
  constructor(private readonly payments: PaymentsService) {}
  @Post("webhook") async webhook(@Body() payload: unknown) { const result = await this.payments.webhook(payload); return { success: true, data: result }; }
}
