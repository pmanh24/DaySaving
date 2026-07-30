import { Body, Controller, Delete, Get, Headers, Post, UseGuards } from "@nestjs/common";
import { IsInt, IsObject, IsOptional, IsString, IsUrl, Max, MaxLength, Min } from "class-validator";
import { ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { PublicUser } from "../auth/auth.types";
import { PushService } from "./push.service";

class SubscribeDto {
  @IsUrl({ require_tld: false }) @MaxLength(2048) endpoint!: string;
  @IsObject() keys!: { p256dh?: unknown; auth?: unknown };
  @IsOptional() @IsInt() @Min(0) @Max(9_999_999_999_999) expirationTime?: number | null;
}

class UnsubscribeDto {
  @IsString() @MaxLength(2048) endpoint!: string;
}

@ApiTags("push")
@Controller("push")
@UseGuards(JwtAuthGuard)
export class PushController {
  constructor(private readonly push: PushService) {}

  @Get("status") async status(@CurrentUser() user: PublicUser) { return { success: true, data: await this.push.status(user.id) }; }
  @Post("subscribe") async subscribe(@CurrentUser() user: PublicUser, @Headers("user-agent") userAgent: string | undefined, @Body() dto: SubscribeDto) { return { success: true, data: await this.push.subscribe(user.id, { endpoint: dto.endpoint, keys: dto.keys as { p256dh: string; auth: string }, expirationTime: dto.expirationTime }, userAgent ?? null) }; }
  @Delete("subscribe") async unsubscribe(@CurrentUser() user: PublicUser, @Body() dto: UnsubscribeDto) { return { success: true, data: await this.push.unsubscribe(user.id, dto.endpoint) }; }
  @Post("test") async test(@CurrentUser() user: PublicUser) { return { success: true, data: await this.push.sendTest(user.id) }; }
}
