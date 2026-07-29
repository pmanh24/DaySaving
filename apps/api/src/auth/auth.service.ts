import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import * as argon2 from "argon2";
import * as jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import type { Model } from "mongoose";
import { ApiError } from "../common/api-error";
import { UserDocument } from "../database/schemas";
import type { UserDoc } from "../database/schemas";
import type { AuthSession, PublicUser } from "./auth.types";

type TokenType = "access" | "refresh";

interface JwtPayload {
  sub: string;
  type: TokenType;
}

@Injectable()
export class AuthService {
  constructor(@InjectModel(UserDocument.name) private readonly users: Model<UserDocument>) {}

  async register(email: string, displayName: string, password: string): Promise<AuthSession> {
    const normalized = email.trim().toLowerCase();
    const existing = await this.users.findOne({ email: normalized }).lean().exec();
    if (existing) throw new ApiError("AUTH_EMAIL_EXISTS", "Email này đã được đăng ký.", 409);

    try {
      const user = await this.users.create({
        email: normalized,
        passwordHash: await argon2.hash(password),
        displayName: displayName.trim(),
        avatarUrl: null,
        timezone: process.env.DEFAULT_TIMEZONE ?? "Asia/Ho_Chi_Minh",
        currency: "VND",
        refreshTokenHash: null,
        status: "ACTIVE",
      });
      return this.createSession(user);
    } catch (error) {
      if (this.isDuplicateKey(error)) throw new ApiError("AUTH_EMAIL_EXISTS", "Email này đã được đăng ký.", 409);
      throw error;
    }
  }

  async login(email: string, password: string): Promise<AuthSession> {
    const user = await this.users.findOne({ email: email.trim().toLowerCase() }).exec();
    if (!user || !(await argon2.verify(user.passwordHash, password))) {
      throw new ApiError("AUTH_INVALID_CREDENTIALS", "Email hoặc mật khẩu không đúng.", 401);
    }
    return this.createSession(user);
  }

  async refresh(refreshToken: string): Promise<AuthSession> {
    const payload = this.verify(refreshToken, "refresh");
    const user = await this.users.findById(payload.sub).exec();
    if (!user?.refreshTokenHash || !(await argon2.verify(user.refreshTokenHash, refreshToken))) {
      throw new ApiError("AUTH_UNAUTHORIZED", "Phiên đăng nhập không hợp lệ.", 401);
    }
    return this.createSession(user);
  }

  async logout(refreshToken?: string): Promise<void> {
    if (!refreshToken) return;
    try {
      const payload = this.verify(refreshToken, "refresh");
      await this.users.findByIdAndUpdate(payload.sub, { $set: { refreshTokenHash: null } }).exec();
    } catch {
      // Logout is idempotent even when the refresh token is already expired.
    }
  }

  verify(token: string, expectedType: TokenType = "access"): JwtPayload {
    try {
      const payload = jwt.verify(token, this.secret(expectedType)) as Partial<JwtPayload>;
      if (!payload.sub || payload.type !== expectedType) throw new Error("Invalid token type");
      return { sub: payload.sub, type: payload.type };
    } catch {
      throw new ApiError("AUTH_UNAUTHORIZED", "Phiên đăng nhập không hợp lệ.", 401);
    }
  }

  async getUser(id: string): Promise<PublicUser> {
    const user = await this.users.findById(id).exec();
    if (!user || user.status !== "ACTIVE") throw new ApiError("AUTH_UNAUTHORIZED", "Không tìm thấy tài khoản.", 401);
    return this.publicUser(user);
  }

  private async createSession(user: UserDoc): Promise<AuthSession> {
    const accessToken = this.token(user._id.toString(), "access");
    const refreshToken = this.token(user._id.toString(), "refresh");
    user.refreshTokenHash = await argon2.hash(refreshToken);
    await user.save();
    return { user: this.publicUser(user), accessToken, refreshToken };
  }

  private token(userId: string, type: TokenType): string {
    const configuredExpiry = process.env[type === "access" ? "JWT_ACCESS_EXPIRES_IN" : "JWT_REFRESH_EXPIRES_IN"];
    const expiresIn = (configuredExpiry ?? (type === "access" ? "15m" : "30d")) as jwt.SignOptions["expiresIn"];
    return jwt.sign({ sub: userId, type, jti: randomUUID() }, this.secret(type), { expiresIn });
  }

  private secret(type: TokenType): string {
    return process.env[type === "access" ? "JWT_ACCESS_SECRET" : "JWT_REFRESH_SECRET"] ?? `local-${type}-secret`;
  }

  private publicUser(user: UserDoc): PublicUser {
    return { id: user._id.toString(), email: user.email, displayName: user.displayName, timezone: user.timezone };
  }

  private isDuplicateKey(error: unknown): boolean {
    return typeof error === "object" && error !== null && "code" in error && (error as { code?: number }).code === 11000;
  }
}
