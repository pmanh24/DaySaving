import { Body, Controller, Get, Post, Req, Res } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { IsEmail, IsString, Matches, MinLength } from "class-validator";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import type { RequestWithUser } from "./auth.types";

class RegisterDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(2) displayName!: string;
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/) password!: string;
}

class LoginDto {
  @IsEmail() email!: string;
  @IsString() password!: string;
}

const REFRESH_COOKIE = "refresh_token";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) response: Response) {
    const session = await this.auth.register(dto.email, dto.displayName, dto.password);
    this.setRefreshCookie(response, session.refreshToken);
    return { success: true, data: { user: session.user, accessToken: session.accessToken } };
  }

  @Post("login")
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const session = await this.auth.login(dto.email, dto.password);
    this.setRefreshCookie(response, session.refreshToken);
    return { success: true, data: { user: session.user, accessToken: session.accessToken } };
  }

  @Post("refresh")
  async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const refreshToken = request.cookies?.[REFRESH_COOKIE];
    const session = await this.auth.refresh(refreshToken);
    this.setRefreshCookie(response, session.refreshToken);
    return { success: true, data: { user: session.user, accessToken: session.accessToken } };
  }

  @Post("logout")
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    await this.auth.logout(request.cookies?.[REFRESH_COOKIE]);
    response.clearCookie(REFRESH_COOKIE, { httpOnly: true, secure: process.env.COOKIE_SECURE === "true", sameSite: "lax", path: "/api/v1/auth" });
    return { success: true, data: null };
  }

  @Get("me")
  async me(@Req() request: RequestWithUser) {
    const token = request.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (!token) return { success: true, data: null };
    const payload = this.auth.verify(token, "access");
    return { success: true, data: await this.auth.getUser(payload.sub) };
  }

  private setRefreshCookie(response: Response, refreshToken: string): void {
    response.cookie(REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === "true",
      sameSite: "lax",
      path: "/api/v1/auth",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }
}
