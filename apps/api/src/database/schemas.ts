import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Schema as MongooseSchema, Types } from "mongoose";

@Schema({ timestamps: true, versionKey: "__v", collection: "users" })
export class UserDocument {
  @Prop({ required: true, lowercase: true, trim: true, minlength: 5, maxlength: 254 }) email!: string;
  @Prop({ required: true, minlength: 20, maxlength: 512 }) passwordHash!: string;
  @Prop({ required: true, minlength: 2, maxlength: 80 }) displayName!: string;
  @Prop({ default: null, type: String }) avatarUrl!: string | null;
  @Prop({ default: "Asia/Ho_Chi_Minh", minlength: 3, maxlength: 64 }) timezone!: string;
  @Prop({ default: "VND", enum: ["VND"] }) currency!: "VND";
  @Prop({ default: null, type: String }) refreshTokenHash!: string | null;
  @Prop({ default: false }) pushReminderEnabled!: boolean;
  @Prop({ default: "15:00", match: /^([01]\d|2[0-3]):[0-5]\d$/ }) pushReminderTime!: string;
  @Prop({ default: "ACTIVE", enum: ["ACTIVE", "DISABLED"] }) status!: "ACTIVE" | "DISABLED";
}
export type UserDoc = HydratedDocument<UserDocument>;
export const UserSchema = SchemaFactory.createForClass(UserDocument);
UserSchema.index({ email: 1 }, { name: "uq_users_email", unique: true });
UserSchema.index({ status: 1, createdAt: -1 }, { name: "idx_users_status_createdAt" });

@Schema({ timestamps: true, versionKey: "__v", collection: "push_subscriptions" })
export class PushSubscriptionDocument {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId }) userId!: Types.ObjectId;
  @Prop({ required: true, unique: true, maxlength: 2048 }) endpoint!: string;
  @Prop({ required: true, type: Object }) keys!: { p256dh: string; auth: string };
  @Prop({ default: null, type: Number }) expirationTime!: number | null;
  @Prop({ default: null, type: String, maxlength: 512 }) userAgent!: string | null;
  @Prop({ default: null, type: Date }) lastUsedAt!: Date | null;
}
export const PushSubscriptionSchema = SchemaFactory.createForClass(PushSubscriptionDocument);
PushSubscriptionSchema.index({ endpoint: 1 }, { name: "uq_push_subscriptions_endpoint", unique: true });
PushSubscriptionSchema.index({ userId: 1, createdAt: -1 }, { name: "idx_push_subscriptions_user_createdAt" });

@Schema({ timestamps: true, versionKey: "__v", collection: "saving_challenges" })
export class ChallengeDocument {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId }) userId!: Types.ObjectId;
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
  @Prop({ default: null, type: Date }) completedAt!: Date | null;
  @Prop({ default: "ACTIVE" }) status!: "ACTIVE" | "COMPLETED" | "ARCHIVED";
}
export const ChallengeSchema = SchemaFactory.createForClass(ChallengeDocument);
ChallengeSchema.index({ userId: 1, status: 1 });
ChallengeSchema.index({ userId: 1, createdAt: -1 });

@Schema({ timestamps: true, versionKey: "__v", collection: "saving_checkins" })
export class CheckinDocument {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId }) challengeId!: Types.ObjectId;
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId }) userId!: Types.ObjectId;
  @Prop({ required: true }) number!: number;
  @Prop({ required: true }) amount!: number;
  @Prop({ required: true }) localDate!: string;
  @Prop({ required: true }) timezone!: string;
  @Prop({ required: true }) idempotencyKey!: string;
  @Prop({ default: "COMPLETED" }) status!: "COMPLETED" | "REVERSED";
  @Prop({ default: null, type: Date }) reversedAt!: Date | null;
  @Prop({ default: null, type: String }) reverseReason!: string | null;
}
export const CheckinSchema = SchemaFactory.createForClass(CheckinDocument);
CheckinSchema.index({ challengeId: 1, number: 1 }, { unique: true, partialFilterExpression: { status: "COMPLETED" } });
CheckinSchema.index({ challengeId: 1, localDate: 1 }, { unique: true, partialFilterExpression: { status: "COMPLETED" } });
CheckinSchema.index({ userId: 1, idempotencyKey: 1 }, { unique: true });
CheckinSchema.index({ challengeId: 1, createdAt: -1 });

@Schema({ timestamps: true, versionKey: "__v", collection: "saving_plans" })
export class SavingPlanDocument {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId }) userId!: Types.ObjectId;
  @Prop({ required: true, minlength: 2, maxlength: 80 }) name!: string;
  @Prop({ required: true, min: 30, max: 300 }) durationDays!: number;
  @Prop({ default: 1, min: 1, max: 300 }) currentDayIndex!: number;
  @Prop({ default: 0, min: 0, max: 300 }) completedDays!: number;
  @Prop({ required: true, enum: ["CLASSIC_SEQUENCE", "TARGET_AUTO_DISTRIBUTION", "CUSTOM_LIST"] }) generationMode!: string;
  @Prop({ required: true, min: 1 }) targetAmount!: number;
  @Prop({ default: 0, min: 0 }) totalSavedAmount!: number;
  @Prop({ required: true, min: 0 }) remainingAmount!: number;
  @Prop({ default: null, type: Number, min: 0 }) unitAmount!: number | null;
  @Prop({ default: null, type: Number, min: 0 }) minAmount!: number | null;
  @Prop({ default: null, type: Number, min: 0 }) maxAmount!: number | null;
  @Prop({ default: null, type: Number, min: 0 }) stepAmount!: number | null;
  @Prop({ default: "FLEXIBLE_CONTRIBUTION_DAYS", enum: ["FLEXIBLE_CONTRIBUTION_DAYS", "CALENDAR_DAYS"] }) progressMode!: string;
  @Prop({ default: "PAYOS_OR_MANUAL", enum: ["PAYOS_ONLY", "PAYOS_OR_MANUAL"] }) confirmationMode!: string;
  @Prop({ default: "SINGLE_OWNER_CHANNEL", enum: ["SINGLE_OWNER_CHANNEL", "PLATFORM_CHANNEL"] }) paymentDestinationMode!: string;
  @Prop({ default: 15, min: 1, max: 1440 }) paymentExpiresInMinutes!: number;
  @Prop({ default: "Asia/Ho_Chi_Minh", minlength: 3, maxlength: 64 }) timezone!: string;
  @Prop({ required: true }) startDate!: Date;
  @Prop({ default: "ACTIVE", enum: ["DRAFT", "SCHEDULED", "ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"] }) status!: string;
  @Prop({ default: null, type: Date }) activatedAt!: Date | null;
  @Prop({ default: null, type: Date }) completedAt!: Date | null;
}
export const SavingPlanSchema = SchemaFactory.createForClass(SavingPlanDocument);
SavingPlanSchema.index({ userId: 1, status: 1 }, { name: "idx_saving_plans_user_status" });
SavingPlanSchema.index({ userId: 1, createdAt: -1 }, { name: "idx_saving_plans_user_createdAt" });
SavingPlanSchema.index({ status: 1, startDate: 1 }, { name: "idx_saving_plans_status_startDate" });

@Schema({ timestamps: true, versionKey: "__v", collection: "saving_slots" })
export class SavingSlotDocument {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId }) userId!: Types.ObjectId;
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId }) planId!: Types.ObjectId;
  @Prop({ required: true, min: 1, max: 300 }) slotIndex!: number;
  @Prop({ required: true, min: 1 }) amount!: number;
  @Prop({ default: "AVAILABLE", enum: ["AVAILABLE", "RESERVED", "PAID", "MANUALLY_COMPLETED"] }) status!: string;
  @Prop({ default: null, type: MongooseSchema.Types.ObjectId }) reservedByPaymentId!: Types.ObjectId | null;
  @Prop({ default: null, type: Date }) reservationExpiresAt!: Date | null;
  @Prop({ default: null, type: Number, min: 1, max: 300 }) assignedDayIndex!: number | null;
  @Prop({ default: null, type: MongooseSchema.Types.ObjectId }) paidPaymentId!: Types.ObjectId | null;
  @Prop({ default: null, type: Date }) completedAt!: Date | null;
}
export const SavingSlotSchema = SchemaFactory.createForClass(SavingSlotDocument);
SavingSlotSchema.index({ planId: 1, slotIndex: 1 }, { name: "uq_saving_slots_plan_slotIndex", unique: true });
SavingSlotSchema.index({ planId: 1, status: 1, amount: 1 }, { name: "idx_saving_slots_plan_status_amount" });
SavingSlotSchema.index({ userId: 1, planId: 1, status: 1 }, { name: "idx_saving_slots_user_plan_status" });
SavingSlotSchema.index(
  { planId: 1, assignedDayIndex: 1 },
  { name: "uq_saving_slots_plan_assignedDayIndex", unique: true, partialFilterExpression: { assignedDayIndex: { $type: "number" } } },
);
SavingSlotSchema.index({ reservationExpiresAt: 1, status: 1 }, { name: "idx_saving_slots_reservationExpiresAt_status" });

@Schema({ timestamps: true, versionKey: "__v", collection: "saving_payments" })
export class SavingPaymentDocument {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId }) userId!: Types.ObjectId;
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId }) planId!: Types.ObjectId;
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId }) slotId!: Types.ObjectId;
  @Prop({ required: true, min: 1, max: 300 }) dayIndex!: number;
  @Prop({ default: "PAYOS", enum: ["PAYOS"] }) provider!: string;
  @Prop({ required: true, min: 1 }) orderCode!: number;
  @Prop({ default: null, type: String }) paymentLinkId!: string | null;
  @Prop({ required: true, min: 1 }) amount!: number;
  @Prop({ default: "VND", enum: ["VND"] }) currency!: string;
  @Prop({ required: true, minlength: 1, maxlength: 25 }) description!: string;
  @Prop({ default: null, type: String }) checkoutUrl!: string | null;
  @Prop({ default: null, type: String }) qrCode!: string | null;
  @Prop({ default: "CREATING", enum: ["CREATING", "PENDING", "PROCESSING", "PAID", "CANCELLED", "EXPIRED", "FAILED"] }) status!: string;
  @Prop({ required: true, minlength: 16, maxlength: 128 }) idempotencyKey!: string;
  @Prop({ required: true }) expiresAt!: Date;
  @Prop({ default: null, type: Date }) paidAt!: Date | null;
  @Prop({ default: null, type: Date }) cancelledAt!: Date | null;
  @Prop({ default: null, type: Date }) failedAt!: Date | null;
  @Prop({ default: null, type: String }) providerReference!: string | null;
  @Prop({ default: null, type: String }) transactionDateTime!: string | null;
  @Prop({ default: null, type: Date }) lastReconciledAt!: Date | null;
  @Prop({ default: null, type: String }) errorCode!: string | null;
  @Prop({ default: null, type: String }) errorMessage!: string | null;
}
export const SavingPaymentSchema = SchemaFactory.createForClass(SavingPaymentDocument);
SavingPaymentSchema.index({ orderCode: 1 }, { name: "uq_saving_payments_orderCode", unique: true });
SavingPaymentSchema.index({ paymentLinkId: 1 }, { name: "uq_saving_payments_paymentLinkId", unique: true, sparse: true });
SavingPaymentSchema.index({ userId: 1, idempotencyKey: 1 }, { name: "uq_saving_payments_user_idempotencyKey", unique: true });
SavingPaymentSchema.index({ planId: 1, status: 1, createdAt: -1 }, { name: "idx_saving_payments_plan_status_createdAt" });
SavingPaymentSchema.index({ slotId: 1, status: 1 }, { name: "idx_saving_payments_slot_status" });
SavingPaymentSchema.index({ expiresAt: 1, status: 1 }, { name: "idx_saving_payments_expiresAt_status" });
SavingPaymentSchema.index(
  { planId: 1, dayIndex: 1 },
  { name: "uq_saving_payments_one_active_payment_per_day", unique: true, partialFilterExpression: { status: { $in: ["CREATING", "PENDING", "PROCESSING"] } } },
);
SavingPaymentSchema.index(
  { slotId: 1 },
  { name: "uq_saving_payments_one_active_or_paid_per_slot", unique: true, partialFilterExpression: { status: { $in: ["CREATING", "PENDING", "PROCESSING", "PAID"] } } },
);

@Schema({ timestamps: true, versionKey: "__v", collection: "challenge_payments" })
export class ChallengePaymentDocument {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId }) userId!: Types.ObjectId;
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId }) challengeId!: Types.ObjectId;
  @Prop({ required: true, min: 1, max: 100 }) number!: number;
  @Prop({ default: "PAYOS", enum: ["PAYOS"] }) provider!: string;
  @Prop({ required: true, min: 1 }) orderCode!: number;
  @Prop({ default: null, type: String }) paymentLinkId!: string | null;
  @Prop({ required: true, min: 1 }) amount!: number;
  @Prop({ default: "VND", enum: ["VND"] }) currency!: string;
  @Prop({ required: true, minlength: 1, maxlength: 25 }) description!: string;
  @Prop({ default: null, type: String }) checkoutUrl!: string | null;
  @Prop({ default: null, type: String }) qrCode!: string | null;
  @Prop({ default: "CREATING", enum: ["CREATING", "PENDING", "PROCESSING", "PAID", "CANCELLED", "EXPIRED", "FAILED"] }) status!: string;
  @Prop({ required: true, minlength: 16, maxlength: 128 }) idempotencyKey!: string;
  @Prop({ required: true }) expiresAt!: Date;
  @Prop({ default: null, type: Date }) paidAt!: Date | null;
  @Prop({ default: null, type: Date }) cancelledAt!: Date | null;
  @Prop({ default: null, type: Date }) lastReconciledAt!: Date | null;
  @Prop({ default: null, type: String }) providerReference!: string | null;
  @Prop({ default: null, type: String }) transactionDateTime!: string | null;
  @Prop({ default: null, type: String }) errorCode!: string | null;
  @Prop({ default: null, type: String }) errorMessage!: string | null;
}
export const ChallengePaymentSchema = SchemaFactory.createForClass(ChallengePaymentDocument);
ChallengePaymentSchema.index({ orderCode: 1 }, { name: "uq_challenge_payments_orderCode", unique: true });
ChallengePaymentSchema.index({ paymentLinkId: 1 }, { name: "uq_challenge_payments_paymentLinkId", unique: true, sparse: true });
ChallengePaymentSchema.index({ userId: 1, idempotencyKey: 1 }, { name: "uq_challenge_payments_user_idempotencyKey", unique: true });
ChallengePaymentSchema.index({ challengeId: 1, number: 1, status: 1 }, { name: "idx_challenge_payments_challenge_number_status" });
ChallengePaymentSchema.index(
  { challengeId: 1, number: 1 },
  { name: "uq_challenge_payments_one_active_per_cell", unique: true, partialFilterExpression: { status: { $in: ["CREATING", "PENDING", "PROCESSING"] } } },
);
ChallengePaymentSchema.index({ expiresAt: 1, status: 1 }, { name: "idx_challenge_payments_expiresAt_status" });

@Schema({ timestamps: true, versionKey: "__v", collection: "saving_day_records" })
export class SavingDayRecordDocument {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId }) userId!: Types.ObjectId;
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId }) planId!: Types.ObjectId;
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId }) slotId!: Types.ObjectId;
  @Prop({ default: null, type: MongooseSchema.Types.ObjectId }) paymentId!: Types.ObjectId | null;
  @Prop({ required: true, min: 1, max: 300 }) dayIndex!: number;
  @Prop({ required: true, min: 1 }) amount!: number;
  @Prop({ required: true, enum: ["PAYOS", "MANUAL"] }) confirmationSource!: string;
  @Prop({ default: "COMPLETED", enum: ["COMPLETED", "REVERSED"] }) status!: string;
  @Prop({ required: true, match: /^\d{4}-\d{2}-\d{2}$/ }) localCompletedDate!: string;
  @Prop({ required: true }) completedAt!: Date;
  @Prop({ default: null, type: Date }) reversedAt!: Date | null;
  @Prop({ default: null, type: String }) reverseReason!: string | null;
}
export const SavingDayRecordSchema = SchemaFactory.createForClass(SavingDayRecordDocument);
SavingDayRecordSchema.index({ planId: 1, dayIndex: 1 }, { name: "uq_saving_day_records_active_day", unique: true, partialFilterExpression: { status: "COMPLETED" } });
SavingDayRecordSchema.index({ planId: 1, slotId: 1 }, { name: "idx_saving_day_records_plan_slot" });
SavingDayRecordSchema.index({ userId: 1, planId: 1, completedAt: -1 }, { name: "idx_saving_day_records_user_plan_completedAt" });

@Schema({ timestamps: true, versionKey: "__v", collection: "payos_webhook_events" })
export class PayosWebhookEventDocument {
  @Prop({ default: null, type: Number, min: 0 }) orderCode!: number | null;
  @Prop({ default: null, type: String }) paymentLinkId!: string | null;
  @Prop({ default: null, type: String }) providerReference!: string | null;
  @Prop({ required: true, minlength: 16, maxlength: 256 }) signatureHash!: string;
  @Prop({ required: true }) verified!: boolean;
  @Prop({ required: true, enum: ["RECEIVED", "PROCESSED", "IGNORED_DUPLICATE", "FAILED"] }) processingStatus!: string;
  @Prop({ default: null, type: String }) errorMessage!: string | null;
  @Prop({ required: true }) receivedAt!: Date;
  @Prop({ default: null, type: Date }) processedAt!: Date | null;
}
export const PayosWebhookEventSchema = SchemaFactory.createForClass(PayosWebhookEventDocument);
PayosWebhookEventSchema.index({ signatureHash: 1 }, { name: "uq_payos_webhook_events_signatureHash", unique: true });
PayosWebhookEventSchema.index({ providerReference: 1 }, { name: "uq_payos_webhook_events_providerReference", unique: true, partialFilterExpression: { providerReference: { $type: "string" } } });
PayosWebhookEventSchema.index({ orderCode: 1, receivedAt: -1 }, { name: "idx_payos_webhook_events_orderCode_receivedAt" });
PayosWebhookEventSchema.index({ processingStatus: 1, receivedAt: -1 }, { name: "idx_payos_webhook_events_status_receivedAt" });

@Schema({ timestamps: true, versionKey: "__v", collection: "saving_events" })
export class SavingEventDocument {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId }) userId!: Types.ObjectId;
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId }) planId!: Types.ObjectId;
  @Prop({ default: null, type: MongooseSchema.Types.ObjectId }) slotId!: Types.ObjectId | null;
  @Prop({ default: null, type: MongooseSchema.Types.ObjectId }) paymentId!: Types.ObjectId | null;
  @Prop({ default: null, type: MongooseSchema.Types.ObjectId }) dayRecordId!: Types.ObjectId | null;
  @Prop({
    required: true,
    enum: [
      "PLAN_CREATED", "PLAN_STARTED", "PLAN_PAUSED", "PLAN_RESUMED", "PLAN_COMPLETED", "PLAN_ARCHIVED",
      "SLOT_RESERVED", "SLOT_RELEASED",
      "PAYMENT_CREATED", "PAYMENT_PAID", "PAYMENT_CANCELLED", "PAYMENT_EXPIRED", "PAYMENT_FAILED",
      "MANUAL_COMPLETION_CREATED", "DAY_RECORD_REVERSED",
    ],
  }) type!: string;
  @Prop({ default: null, type: Object }) previousData!: Record<string, unknown> | null;
  @Prop({ default: null, type: Object }) currentData!: Record<string, unknown> | null;
  @Prop({ default: null, type: Object }) metadata!: Record<string, unknown> | null;
}
export const SavingEventSchema = SchemaFactory.createForClass(SavingEventDocument);
SavingEventSchema.index({ planId: 1, createdAt: -1 }, { name: "idx_saving_events_plan_createdAt" });
SavingEventSchema.index({ userId: 1, type: 1, createdAt: -1 }, { name: "idx_saving_events_user_type_createdAt" });
SavingEventSchema.index({ paymentId: 1, createdAt: -1 }, { name: "idx_saving_events_payment_createdAt", partialFilterExpression: { paymentId: { $type: "objectId" } } });

@Schema({ timestamps: true, versionKey: "__v", collection: "counters" })
export class CounterDocument {
  @Prop({ required: true, type: String, minlength: 1, maxlength: 100 }) _id!: string;
  @Prop({ required: true, min: 0 }) sequenceValue!: number;
}
export const CounterSchema = SchemaFactory.createForClass(CounterDocument);
