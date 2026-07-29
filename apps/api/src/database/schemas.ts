import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

@Schema({ timestamps: true, collection: "users" })
export class UserDocument {
  @Prop({ required: true, unique: true, lowercase: true, trim: true }) email!: string;
  @Prop({ required: true }) passwordHash!: string;
  @Prop({ required: true }) displayName!: string;
  @Prop({ default: null }) avatarUrl!: string | null;
  @Prop({ default: "Asia/Ho_Chi_Minh" }) timezone!: string;
  @Prop({ default: "VND" }) currency!: "VND";
  @Prop({ default: null }) refreshTokenHash!: string | null;
  @Prop({ default: "ACTIVE", enum: ["ACTIVE", "DISABLED"] }) status!: "ACTIVE" | "DISABLED";
}
export type UserDoc = HydratedDocument<UserDocument>;
export const UserSchema = SchemaFactory.createForClass(UserDocument);
UserSchema.index({ email: 1 }, { unique: true });

@Schema({ timestamps: true, collection: "saving_challenges" })
export class ChallengeDocument {
  @Prop({ required: true }) userId!: string;
  @Prop({ required: true }) name!: string;
  @Prop({ default: 1 }) minNumber!: number;
  @Prop({ default: 100 }) maxNumber!: number;
  @Prop({ default: 1000 }) unitAmount!: number;
  @Prop({ required: true }) targetAmount!: number;
  @Prop({ default: 0 }) savedAmount!: number;
  @Prop({ default: 0 }) completedCells!: number;
  @Prop({ default: "ONE_PER_DAY" }) mode!: "ONE_PER_DAY" | "FLEXIBLE";
  @Prop({ default: "FREE" }) selectionMode!: string;
  @Prop({ required: true }) startDate!: Date;
  @Prop({ default: null }) completedAt!: Date | null;
  @Prop({ default: "ACTIVE" }) status!: "ACTIVE" | "COMPLETED" | "ARCHIVED";
}
export const ChallengeSchema = SchemaFactory.createForClass(ChallengeDocument);
ChallengeSchema.index({ userId: 1, status: 1 });
ChallengeSchema.index({ userId: 1, createdAt: -1 });

@Schema({ timestamps: true, collection: "saving_checkins" })
export class CheckinDocument {
  @Prop({ required: true }) challengeId!: string;
  @Prop({ required: true }) userId!: string;
  @Prop({ required: true }) number!: number;
  @Prop({ required: true }) amount!: number;
  @Prop({ required: true }) localDate!: string;
  @Prop({ required: true }) timezone!: string;
  @Prop({ required: true }) idempotencyKey!: string;
  @Prop({ default: "COMPLETED" }) status!: "COMPLETED" | "REVERSED";
  @Prop({ default: null }) reversedAt!: Date | null;
  @Prop({ default: null }) reverseReason!: string | null;
}
export const CheckinSchema = SchemaFactory.createForClass(CheckinDocument);
CheckinSchema.index({ challengeId: 1, number: 1 }, { unique: true, partialFilterExpression: { status: "COMPLETED" } });
CheckinSchema.index({ challengeId: 1, localDate: 1 }, { unique: true, partialFilterExpression: { status: "COMPLETED" } });
CheckinSchema.index({ userId: 1, idempotencyKey: 1 }, { unique: true });
CheckinSchema.index({ challengeId: 1, createdAt: -1 });

@Schema({ timestamps: true, collection: "saving_plans" })
export class SavingPlanDocument {
  @Prop({ required: true }) userId!: string;
  @Prop({ required: true, minlength: 2, maxlength: 80 }) name!: string;
  @Prop({ required: true, min: 1, max: 300 }) durationDays!: number;
  @Prop({ default: 1 }) currentDayIndex!: number;
  @Prop({ default: 0 }) completedDays!: number;
  @Prop({ required: true }) generationMode!: string;
  @Prop({ required: true }) targetAmount!: number;
  @Prop({ default: 0 }) totalSavedAmount!: number;
  @Prop({ required: true }) remainingAmount!: number;
  @Prop({ default: null }) unitAmount!: number | null;
  @Prop({ default: null }) minAmount!: number | null;
  @Prop({ default: null }) maxAmount!: number | null;
  @Prop({ default: null }) stepAmount!: number | null;
  @Prop({ default: "FLEXIBLE_CONTRIBUTION_DAYS" }) progressMode!: string;
  @Prop({ default: "PAYOS_ONLY" }) confirmationMode!: string;
  @Prop({ default: "SINGLE_OWNER_CHANNEL" }) paymentDestinationMode!: string;
  @Prop({ default: 15 }) paymentExpiresInMinutes!: number;
  @Prop({ default: "Asia/Ho_Chi_Minh" }) timezone!: string;
  @Prop({ required: true }) startDate!: Date;
  @Prop({ default: "ACTIVE" }) status!: string;
  @Prop({ default: null }) activatedAt!: Date | null;
  @Prop({ default: null }) completedAt!: Date | null;
}
export const SavingPlanSchema = SchemaFactory.createForClass(SavingPlanDocument);
SavingPlanSchema.index({ userId: 1, status: 1 });
SavingPlanSchema.index({ userId: 1, createdAt: -1 });

@Schema({ timestamps: true, collection: "saving_slots" })
export class SavingSlotDocument {
  @Prop({ required: true }) userId!: string;
  @Prop({ required: true }) planId!: string;
  @Prop({ required: true }) slotIndex!: number;
  @Prop({ required: true }) amount!: number;
  @Prop({ default: "AVAILABLE" }) status!: string;
  @Prop({ default: null }) reservedByPaymentId!: string | null;
  @Prop({ default: null }) reservationExpiresAt!: Date | null;
  @Prop({ default: null }) assignedDayIndex!: number | null;
  @Prop({ default: null }) paidPaymentId!: string | null;
  @Prop({ default: null }) completedAt!: Date | null;
}
export const SavingSlotSchema = SchemaFactory.createForClass(SavingSlotDocument);
SavingSlotSchema.index({ planId: 1, slotIndex: 1 }, { unique: true });
SavingSlotSchema.index({ planId: 1, status: 1, amount: 1 });
SavingSlotSchema.index({ planId: 1, assignedDayIndex: 1 });

@Schema({ timestamps: true, collection: "saving_payments" })
export class SavingPaymentDocument {
  @Prop({ required: true }) userId!: string;
  @Prop({ required: true }) planId!: string;
  @Prop({ required: true }) slotId!: string;
  @Prop({ required: true }) dayIndex!: number;
  @Prop({ default: "PAYOS" }) provider!: string;
  @Prop({ required: true, unique: true }) orderCode!: number;
  @Prop({ default: null, sparse: true }) paymentLinkId!: string | null;
  @Prop({ required: true }) amount!: number;
  @Prop({ default: "VND" }) currency!: string;
  @Prop({ required: true }) description!: string;
  @Prop({ default: null }) checkoutUrl!: string | null;
  @Prop({ default: null }) qrCode!: string | null;
  @Prop({ default: "CREATING" }) status!: string;
  @Prop({ required: true }) idempotencyKey!: string;
  @Prop({ required: true }) expiresAt!: Date;
  @Prop({ default: null }) paidAt!: Date | null;
  @Prop({ default: null }) cancelledAt!: Date | null;
  @Prop({ default: null }) lastReconciledAt!: Date | null;
  @Prop({ default: null }) errorCode!: string | null;
  @Prop({ default: null }) errorMessage!: string | null;
}
export const SavingPaymentSchema = SchemaFactory.createForClass(SavingPaymentDocument);
SavingPaymentSchema.index({ orderCode: 1 }, { unique: true });
SavingPaymentSchema.index({ paymentLinkId: 1 }, { unique: true, sparse: true });
SavingPaymentSchema.index({ userId: 1, idempotencyKey: 1 }, { unique: true });
SavingPaymentSchema.index({ planId: 1, status: 1, createdAt: -1 });
SavingPaymentSchema.index({ expiresAt: 1, status: 1 });

@Schema({ timestamps: true, collection: "saving_day_records" })
export class SavingDayRecordDocument {
  @Prop({ required: true }) userId!: string;
  @Prop({ required: true }) planId!: string;
  @Prop({ required: true }) slotId!: string;
  @Prop({ default: null }) paymentId!: string | null;
  @Prop({ required: true }) dayIndex!: number;
  @Prop({ required: true }) amount!: number;
  @Prop({ required: true }) confirmationSource!: string;
  @Prop({ default: "COMPLETED" }) status!: string;
  @Prop({ required: true }) localCompletedDate!: string;
  @Prop({ required: true }) completedAt!: Date;
}
export const SavingDayRecordSchema = SchemaFactory.createForClass(SavingDayRecordDocument);
SavingDayRecordSchema.index({ planId: 1, dayIndex: 1 }, { unique: true, partialFilterExpression: { status: "COMPLETED" } });
SavingDayRecordSchema.index({ planId: 1, slotId: 1 });

@Schema({ timestamps: true, collection: "payos_webhook_events" })
export class PayosWebhookEventDocument {
  @Prop({ default: null }) orderCode!: number | null;
  @Prop({ default: null }) paymentLinkId!: string | null;
  @Prop({ default: null }) providerReference!: string | null;
  @Prop({ required: true }) signatureHash!: string;
  @Prop({ required: true }) verified!: boolean;
  @Prop({ required: true }) processingStatus!: string;
  @Prop({ default: null }) errorMessage!: string | null;
  @Prop({ required: true }) receivedAt!: Date;
  @Prop({ default: null }) processedAt!: Date | null;
}
export const PayosWebhookEventSchema = SchemaFactory.createForClass(PayosWebhookEventDocument);
PayosWebhookEventSchema.index({ signatureHash: 1 }, { unique: true });
PayosWebhookEventSchema.index({ orderCode: 1, createdAt: -1 });
