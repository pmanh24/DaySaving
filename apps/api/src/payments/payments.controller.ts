import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { PaymentsService } from "./payments.service";
import { CreatePaymentDto } from "./dto/create-payment.dto";

@ApiTags("payments")
@Controller()
export class PaymentsController {
  private readonly demoUser = "demo-user";
  constructor(private readonly payments: PaymentsService) {}
  @Post("saving-plans/:planId/payments") async create(@Param("planId") planId: string, @Body() dto: CreatePaymentDto) { return { success: true, data: await this.payments.create(this.demoUser, { planId, slotId: dto.slotId, idempotencyKey: dto.idempotencyKey }) }; }
  @Get("payments/:paymentId") get(@Param("paymentId") paymentId: string) { return { success: true, data: this.payments.get(this.demoUser, paymentId) }; }
  @Post("payments/:paymentId/reconcile") async reconcile(@Param("paymentId") paymentId: string) { return { success: true, data: await this.payments.reconcile(this.demoUser, paymentId) }; }
  @Post("payments/:paymentId/cancel") async cancel(@Param("paymentId") paymentId: string) { return { success: true, data: await this.payments.cancel(this.demoUser, paymentId) }; }
}
