import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { IsInt, IsString, IsUUID, Min } from "class-validator";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { PublicUser } from "../auth/auth.types";
import { ChallengePaymentsService } from "./challenge-payments.service";

class CreateChallengePaymentDto {
  @IsInt() @Min(1) number!: number;
  @IsString() @IsUUID() idempotencyKey!: string;
}

@ApiTags("challenge-payments")
@Controller()
@UseGuards(JwtAuthGuard)
export class ChallengePaymentsController {
  constructor(private readonly payments: ChallengePaymentsService) {}

  @Post("challenges/:challengeId/payments")
  async create(@CurrentUser() user: PublicUser, @Param("challengeId") challengeId: string, @Body() dto: CreateChallengePaymentDto) {
    return { success: true, data: await this.payments.create(user.id, challengeId, dto) };
  }

  @Get("challenge-payments/:paymentId")
  async get(@CurrentUser() user: PublicUser, @Param("paymentId") paymentId: string) {
    return { success: true, data: await this.payments.get(user.id, paymentId) };
  }

  @Post("challenge-payments/:paymentId/reconcile")
  async reconcile(@CurrentUser() user: PublicUser, @Param("paymentId") paymentId: string) {
    return { success: true, data: await this.payments.reconcile(user.id, paymentId) };
  }

  @Post("challenge-payments/:paymentId/cancel")
  async cancel(@CurrentUser() user: PublicUser, @Param("paymentId") paymentId: string) {
    return { success: true, data: await this.payments.cancel(user.id, paymentId) };
  }
}
