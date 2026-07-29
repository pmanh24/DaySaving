import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString, IsUUID, Min } from "class-validator";
import { ChallengesService } from "./challenges.service";

class CreateChallengeDto { @IsOptional() @IsString() name?: string; }
class CheckinDto { @IsInt() @Min(1) number!: number; @IsString() @IsUUID() idempotencyKey!: string; }

@ApiTags("challenges")
@Controller("challenges")
export class ChallengesController {
  constructor(private readonly challenges: ChallengesService) {}
  @Post() create(@Body() dto: CreateChallengeDto) { return { success: true, data: this.challenges.create("demo-user", dto.name) }; }
  @Get() list() { return { success: true, data: this.challenges.list() }; }
  @Get("current") current() { return { success: true, data: this.challenges.board() }; }
  @Get(":challengeId/statistics") statistics(@Param("challengeId") challengeId: string) { return { success: true, data: this.challenges.statistics("demo-user", challengeId) }; }
  @Get(":challengeId/board") board(@Param("challengeId") challengeId: string) { return { success: true, data: this.challenges.board("demo-user", challengeId) }; }
  @Post(":challengeId/checkins") checkIn(@Param("challengeId") challengeId: string, @Body() dto: CheckinDto) { return { success: true, data: this.challenges.checkIn("demo-user", challengeId, dto.number, dto.idempotencyKey) }; }
  @Get(":challengeId/history") history(@Param("challengeId") challengeId: string) { return { success: true, data: this.challenges.history("demo-user", challengeId) }; }
  @Get(":challengeId/random-suggestion") random(@Param("challengeId") challengeId: string, @Query("range") _range?: string) { return { success: true, data: this.challenges.random("demo-user", challengeId) }; }
  @Post("checkins/:checkinId/reverse") reverse(@Param("checkinId") checkinId: string) { return { success: true, data: this.challenges.reverse("demo-user", checkinId) }; }
}
