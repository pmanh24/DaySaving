import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectModel } from "@nestjs/mongoose";
import { Types, type Model } from "mongoose";
import webpush from "web-push";
import { ApiError } from "../common/api-error";
import { PushSubscriptionDocument, UserDocument } from "../database/schemas";

interface SubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  expirationTime?: number | null;
}

export interface PushStatus {
  configured: boolean;
  enabled: boolean;
  subscriptionCount: number;
  reminderTime: string;
}

interface NotificationPayload {
  title: string;
  body: string;
  url: string;
  tag: string;
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly configured: boolean;
  private readonly reminderTime: string;

  constructor(
    @InjectModel(PushSubscriptionDocument.name) private readonly subscriptionModel: Model<PushSubscriptionDocument>,
    @InjectModel(UserDocument.name) private readonly userModel: Model<UserDocument>,
  ) {
    const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
    const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
    const subject = process.env.VAPID_SUBJECT?.trim();
    this.configured = Boolean(publicKey && privateKey && subject);
    this.reminderTime = this.validTime(process.env.PUSH_REMINDER_TIME) ? process.env.PUSH_REMINDER_TIME! : "20:00";
    if (this.configured) webpush.setVapidDetails(subject!, publicKey!, privateKey!);
  }

  async subscribe(userId: string, input: SubscriptionInput, userAgent: string | null): Promise<PushStatus> {
    this.requireConfiguration();
    this.validateSubscription(input);
    await this.subscriptionModel.findOneAndUpdate(
      { endpoint: input.endpoint },
      {
        $set: {
          userId: this.objectId(userId),
          endpoint: input.endpoint,
          keys: input.keys,
          expirationTime: input.expirationTime ?? null,
          userAgent,
          lastUsedAt: new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).exec();
    await this.userModel.updateOne({ _id: this.objectId(userId) }, { $set: { pushReminderEnabled: true } }).exec();
    return this.status(userId);
  }

  async unsubscribe(userId: string, endpoint: string): Promise<PushStatus> {
    if (!endpoint?.trim()) throw new ApiError("PUSH_ENDPOINT_INVALID", "Thiết bị thông báo không hợp lệ.", 400);
    await this.subscriptionModel.deleteOne({ userId: this.objectId(userId), endpoint: endpoint.trim() }).exec();
    const subscriptionCount = await this.subscriptionModel.countDocuments({ userId: this.objectId(userId) }).exec();
    if (subscriptionCount === 0) await this.userModel.updateOne({ _id: this.objectId(userId) }, { $set: { pushReminderEnabled: false } }).exec();
    return this.status(userId);
  }

  async status(userId: string): Promise<PushStatus> {
    const [user, subscriptionCount] = await Promise.all([
      this.userModel.findById(this.objectId(userId)).select({ pushReminderEnabled: 1, pushReminderTime: 1 }).lean().exec(),
      this.subscriptionModel.countDocuments({ userId: this.objectId(userId) }).exec(),
    ]);
    return {
      configured: this.configured,
      enabled: Boolean(user?.pushReminderEnabled && subscriptionCount > 0),
      subscriptionCount,
      reminderTime: user?.pushReminderTime && this.validTime(user.pushReminderTime) ? user.pushReminderTime : this.reminderTime,
    };
  }

  async sendTest(userId: string): Promise<{ sent: number }> {
    this.requireConfiguration();
    return { sent: await this.sendToUser(userId, { title: "Thông báo đã được bật", body: "Đây là thông báo thử từ 100 Days Saving.", url: "/profile", tag: "saving-test" }) };
  }

  @Cron("0 * * * *")
  async sendScheduledReminders(): Promise<void> {
    if (!this.configured) return;
    const users = await this.userModel.find({ status: "ACTIVE", pushReminderEnabled: true }).select({ _id: 1, timezone: 1, pushReminderTime: 1 }).lean().exec();
    for (const user of users) {
      const reminderTime = user.pushReminderTime && this.validTime(user.pushReminderTime) ? user.pushReminderTime : this.reminderTime;
      if (this.localTime(user.timezone || "Asia/Ho_Chi_Minh") !== reminderTime) continue;
      try {
        await this.sendToUser(user._id.toString(), { title: "Đến giờ tiết kiệm rồi", body: "Dành vài phút hoàn thành khoản tiết kiệm hôm nay nhé.", url: "/", tag: "saving-daily-reminder" });
      } catch (error) {
        this.logger.warn(`Không thể gửi nhắc nhở cho user ${user._id.toString()}: ${this.errorMessage(error)}`);
      }
    }
  }

  private async sendToUser(userId: string, payload: NotificationPayload): Promise<number> {
    const subscriptions = await this.subscriptionModel.find({ userId: this.objectId(userId) }).exec();
    let sent = 0;
    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification({ endpoint: subscription.endpoint, expirationTime: subscription.expirationTime, keys: subscription.keys }, JSON.stringify(payload), { TTL: 3600 });
        subscription.lastUsedAt = new Date();
        await subscription.save();
        sent += 1;
      } catch (error) {
        const statusCode = this.statusCode(error);
        if (statusCode === 404 || statusCode === 410) await this.subscriptionModel.deleteOne({ _id: subscription._id }).exec();
        else this.logger.warn(`Gửi Web Push thất bại: ${this.errorMessage(error)}`);
      }
    }
    return sent;
  }

  private requireConfiguration(): void {
    if (!this.configured) throw new ApiError("PUSH_NOT_CONFIGURED", "Thông báo chưa được cấu hình trên máy chủ.", 503);
  }

  private validateSubscription(input: SubscriptionInput): void {
    if (!input.endpoint || input.endpoint.length > 2048 || !input.keys || typeof input.keys.p256dh !== "string" || typeof input.keys.auth !== "string") {
      throw new ApiError("PUSH_SUBSCRIPTION_INVALID", "Thông tin thiết bị thông báo không hợp lệ.", 400);
    }
  }

  private objectId(value: string): Types.ObjectId { return new Types.ObjectId(value); }
  private validTime(value: string | undefined): boolean { return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value); }
  private localTime(timezone: string): string { return new Intl.DateTimeFormat("en-GB", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date()); }
  private statusCode(error: unknown): number { return typeof error === "object" && error !== null && "statusCode" in error ? Number((error as { statusCode?: unknown }).statusCode) : 0; }
  private errorMessage(error: unknown): string { return error instanceof Error ? error.message : "unknown error"; }
}
