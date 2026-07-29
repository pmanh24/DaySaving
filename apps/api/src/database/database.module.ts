import { Global, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import {
  CounterDocument, CounterSchema, PayosWebhookEventDocument, PayosWebhookEventSchema,
  ChallengeDocument, ChallengeSchema, CheckinDocument, CheckinSchema, SavingDayRecordDocument, SavingDayRecordSchema, SavingPaymentDocument, SavingPaymentSchema, SavingPlanDocument, SavingPlanSchema, SavingSlotDocument, SavingSlotSchema,
  SavingEventDocument, SavingEventSchema, UserDocument, UserSchema,
} from "./schemas";

const DATABASE_NAME = "saving_100_app";

@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>("MONGODB_URI"),
        dbName: DATABASE_NAME,
        autoIndex: false,
        maxPoolSize: 10,
        minPoolSize: 0,
        serverSelectionTimeoutMS: 15000,
        appName: "saving-100-api",
      }),
    }),
    MongooseModule.forFeature([
      { name: UserDocument.name, schema: UserSchema },
      { name: ChallengeDocument.name, schema: ChallengeSchema },
      { name: CheckinDocument.name, schema: CheckinSchema },
      { name: SavingPlanDocument.name, schema: SavingPlanSchema },
      { name: SavingSlotDocument.name, schema: SavingSlotSchema },
      { name: SavingPaymentDocument.name, schema: SavingPaymentSchema },
      { name: SavingDayRecordDocument.name, schema: SavingDayRecordSchema },
      { name: PayosWebhookEventDocument.name, schema: PayosWebhookEventSchema },
      { name: SavingEventDocument.name, schema: SavingEventSchema },
      { name: CounterDocument.name, schema: CounterSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
