import { Body, Controller, Get, Post, Req, Res } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { IsEmail, IsString, Matches, MinLength } from "class-validator";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";

class RegisterDto { @IsEmail() email!: string; @IsString() @MinLength(2) displayName!: string; @Matches(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/) password!: string; }
class LoginDto { @IsEmail() email!: string; @IsString() password!: string; }

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post("register") async register(@Body() dto: RegisterDto) { return { success: true, data: await this.auth.register(dto.email, dto.displayName, dto.password) }; }
  @Post("login") async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) { const result = await this.auth.login(dto.email, dto.password); response.cookie("refresh_token", result.refreshToken, { httpOnly: true, secure: process.env.COOKIE_SECURE === "true", sameSite: "lax", path: "/api/v1/auth" }); return { success: true, data: { user: result.user, accessToken: result.accessToken } }; }
  @Post("logout") logout(@Res({ passthrough: true }) response: Response) { response.clearCookie("refresh_token", { path: "/api/v1/auth" }); return { success: true, data: null }; }
  @Get("me") me(@Req() request: Request) { const token = request.headers.authorization?.replace("Bearer ", ""); if (!token) return { success: true, data: null }; return { success: true, data: this.auth.getUser(this.auth.verify(token).sub) }; }
}
