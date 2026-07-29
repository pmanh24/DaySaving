import { Injectable } from "@nestjs/common";
import * as argon2 from "argon2";
import { randomUUID } from "node:crypto";
import * as jwt from "jsonwebtoken";
import { ApiError } from "../common/api-error";

export interface User { id: string; email: string; displayName: string; passwordHash: string; timezone: string; }

@Injectable()
export class AuthService {
  private readonly users = new Map<string, User>();
  async register(email: string, displayName: string, password: string): Promise<Omit<User, "passwordHash">> {
    const normalized = email.trim().toLowerCase();
    if ([...this.users.values()].some((user) => user.email === normalized)) throw new ApiError("AUTH_EMAIL_EXISTS", "Email này đã được đăng ký.", 409);
    const user: User = { id: randomUUID(), email: normalized, displayName: displayName.trim(), passwordHash: await argon2.hash(password), timezone: process.env.DEFAULT_TIMEZONE ?? "Asia/Ho_Chi_Minh" };
    this.users.set(user.id, user);
    return this.publicUser(user);
  }
  async login(email: string, password: string): Promise<{ user: Omit<User, "passwordHash">; accessToken: string; refreshToken: string }> {
    const user = [...this.users.values()].find((item) => item.email === email.trim().toLowerCase());
    if (!user || !(await argon2.verify(user.passwordHash, password))) throw new ApiError("AUTH_INVALID_CREDENTIALS", "Email hoặc mật khẩu không đúng.", 401);
    return { user: this.publicUser(user), accessToken: this.token(user, "access"), refreshToken: this.token(user, "refresh") };
  }
  verify(token: string): { sub: string } {
    try { return jwt.verify(token, process.env.JWT_ACCESS_SECRET ?? "local-access-secret") as { sub: string }; }
    catch { throw new ApiError("AUTH_UNAUTHORIZED", "Phiên đăng nhập không hợp lệ.", 401); }
  }
  getUser(id: string): Omit<User, "passwordHash"> { const user = this.users.get(id); if (!user) throw new ApiError("AUTH_UNAUTHORIZED", "Không tìm thấy tài khoản.", 401); return this.publicUser(user); }
  private token(user: User, type: "access" | "refresh"): string { return jwt.sign({ sub: user.id, type }, process.env[type === "access" ? "JWT_ACCESS_SECRET" : "JWT_REFRESH_SECRET"] ?? `local-${type}-secret`, { expiresIn: type === "access" ? "15m" : "30d" }); }
  private publicUser(user: User): Omit<User, "passwordHash"> { const { passwordHash: _passwordHash, ...publicUser } = user; return publicUser; }
}
