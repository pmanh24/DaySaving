import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { PaymentsService } from "./payments.service";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { PublicUser } from "../auth/auth.types";

@ApiTags("payments")
@Controller()
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}
  @Post("saving-plans/:planId/payments") async create(@CurrentUser() user: PublicUser, @Param("planId") planId: string, @Body() dto: CreatePaymentDto) { return { success: true, data: await this.payments.create(user.id, { planId, slotId: dto.slotId, idempotencyKey: dto.idempotencyKey }) }; }
  @Get("payments/:paymentId") get(@CurrentUser() user: PublicUser, @Param("paymentId") paymentId: string) { return { success: true, data: this.payments.get(user.id, paymentId) }; }
  @Post("payments/:paymentId/reconcile") async reconcile(@CurrentUser() user: PublicUser, @Param("paymentId") paymentId: string) { return { success: true, data: await this.payments.reconcile(user.id, paymentId) }; }
  @Post("payments/:paymentId/cancel") async cancel(@CurrentUser() user: PublicUser, @Param("paymentId") paymentId: string) { return { success: true, data: await this.payments.cancel(user.id, paymentId) }; }
}
