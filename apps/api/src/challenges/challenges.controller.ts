import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString, IsUUID, Min } from "class-validator";
import { ChallengesService } from "./challenges.service";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { PublicUser } from "../auth/auth.types";

class CreateChallengeDto { @IsOptional() @IsString() name?: string; }
class CheckinDto { @IsInt() @Min(1) number!: number; @IsString() @IsUUID() idempotencyKey!: string; }

@ApiTags("challenges")
@Controller("challenges")
@UseGuards(JwtAuthGuard)
export class ChallengesController {
  constructor(private readonly challenges: ChallengesService) {}
  @Post() create(@CurrentUser() user: PublicUser, @Body() dto: CreateChallengeDto) { return { success: true, data: this.challenges.create(user.id, dto.name) }; }
  @Get() list(@CurrentUser() user: PublicUser) { return { success: true, data: this.challenges.list(user.id) }; }
  @Get("current") current(@CurrentUser() user: PublicUser) { return { success: true, data: this.challenges.board(user.id) }; }
  @Get(":challengeId/statistics") statistics(@CurrentUser() user: PublicUser, @Param("challengeId") challengeId: string) { return { success: true, data: this.challenges.statistics(user.id, challengeId) }; }
  @Get(":challengeId/board") board(@CurrentUser() user: PublicUser, @Param("challengeId") challengeId: string) { return { success: true, data: this.challenges.board(user.id, challengeId) }; }
  @Post(":challengeId/checkins") checkIn(@CurrentUser() user: PublicUser, @Param("challengeId") challengeId: string, @Body() dto: CheckinDto) { return { success: true, data: this.challenges.checkIn(user.id, challengeId, dto.number, dto.idempotencyKey) }; }
  @Get(":challengeId/history") history(@CurrentUser() user: PublicUser, @Param("challengeId") challengeId: string) { return { success: true, data: this.challenges.history(user.id, challengeId) }; }
  @Get(":challengeId/random-suggestion") random(@CurrentUser() user: PublicUser, @Param("challengeId") challengeId: string, @Query("range") _range?: string) { return { success: true, data: this.challenges.random(user.id, challengeId) }; }
  @Post("checkins/:checkinId/reverse") reverse(@CurrentUser() user: PublicUser, @Param("checkinId") checkinId: string) { return { success: true, data: this.challenges.reverse(user.id, checkinId) }; }
}
