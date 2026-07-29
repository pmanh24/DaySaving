import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { IsArray, IsDateString, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from "class-validator";
import type { AmountGenerationMode, PaymentDestinationMode, ProgressMode, SavingConfirmationMode, SavingSlotStatus } from "@saving/shared";
import { SavingPlansService } from "./saving-plans.service";

class AmountInputDto { @IsInt() @Min(1) @Max(300) durationDays!: number; @IsEnum(["CLASSIC_SEQUENCE", "TARGET_AUTO_DISTRIBUTION", "CUSTOM_LIST"]) generationMode!: AmountGenerationMode; @IsOptional() @IsInt() @Min(1) unitAmount?: number; @IsOptional() @IsInt() @Min(1) targetAmount?: number; @IsOptional() @IsInt() @Min(1) minAmount?: number; @IsOptional() @IsInt() @Min(1) maxAmount?: number; @IsOptional() @IsInt() @Min(1) stepAmount?: number; @IsOptional() @IsArray() customAmounts?: number[]; }
class CreatePlanDto extends AmountInputDto { @IsString() @MinLength(2) @MaxLength(80) name!: string; @IsDateString() startDate!: string; @IsOptional() @IsString() timezone?: string; @IsOptional() @IsEnum(["FLEXIBLE_CONTRIBUTION_DAYS", "CALENDAR_DAYS"]) progressMode?: ProgressMode; @IsOptional() @IsEnum(["PAYOS_ONLY", "PAYOS_OR_MANUAL"]) confirmationMode?: SavingConfirmationMode; @IsOptional() @IsEnum(["SINGLE_OWNER_CHANNEL", "PLATFORM_CHANNEL"]) paymentDestinationMode?: PaymentDestinationMode; @IsOptional() @IsInt() @Min(10) @Max(30) paymentExpiresInMinutes?: number; }
class ManualCompleteDto { @IsOptional() @IsString() note?: string; }

@ApiTags("saving-plans")
@Controller("saving-plans")
export class SavingPlansController {
  private readonly demoUser = "demo-user";
  constructor(private readonly plans: SavingPlansService) {}
  @Post("preview") preview(@Body() dto: AmountInputDto) { return { success: true, data: this.plans.preview(dto) }; }
  @Post() create(@Body() dto: CreatePlanDto) { return { success: true, data: this.plans.create(this.demoUser, { ...dto, timezone: dto.timezone ?? "Asia/Ho_Chi_Minh" }) }; }
  @Post(":planId/start") start(@Param("planId") planId: string) { return { success: true, data: this.plans.start(this.demoUser, planId) }; }
  @Get(":planId/today") today(@Param("planId") planId: string) { return { success: true, data: this.plans.today(this.demoUser, planId) }; }
  @Get(":planId/slots") slots(@Param("planId") planId: string, @Query("status") status?: SavingSlotStatus, @Query("minAmount") minAmount?: string, @Query("maxAmount") maxAmount?: string, @Query("sort") sort?: string, @Query("page") page?: string, @Query("limit") limit?: string) { return { success: true, data: this.plans.slots(this.demoUser, planId, status, minAmount ? Number(minAmount) : undefined, maxAmount ? Number(maxAmount) : undefined, sort, page ? Number(page) : 1, limit ? Number(limit) : 60) }; }
  @Get(":planId/slot-statistics") slotStatistics(@Param("planId") planId: string) { return { success: true, data: this.plans.slotStatistics(this.demoUser, planId) }; }
  @Get(":planId/day-records") records(@Param("planId") planId: string) { return { success: true, data: this.plans.records(this.demoUser, planId) }; }
  @Post(":planId/slots/:slotId/manual-complete") manualComplete(@Param("planId") planId: string, @Param("slotId") slotId: string, @Body() dto: ManualCompleteDto) { return { success: true, data: this.plans.manualComplete(this.demoUser, planId, slotId, dto.note ?? "") }; }
  @Get(":planId") get(@Param("planId") planId: string) { return { success: true, data: this.plans.get(this.demoUser, planId) }; }
}
