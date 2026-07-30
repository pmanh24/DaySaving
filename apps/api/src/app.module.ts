import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { ScheduleModule } from "@nestjs/schedule";
import { APP_GUARD } from "@nestjs/core";
import { AuthModule } from "./auth/auth.module";
import { ChallengesModule } from "./challenges/challenges.module";
import { HealthController } from "./health/health.controller";
import { SavingPlansModule } from "./saving-plans/saving-plans.module";
import { PaymentsModule } from "./payments/payments.module";
import { DatabaseModule } from "./database/database.module";
import { DatabaseHealthController } from "./health/database-health.controller";
import { PushModule } from "./push/push.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: [
        "apps/api/.env.local",
        "apps/api/.env",
        ".env.local",
        ".env",
        "../../.env.local",
        "../../.env",
      ],
      validate: (config: Record<string, unknown>) => {
        if (typeof config.MONGODB_URI !== "string" || config.MONGODB_URI.trim().length === 0) {
          throw new Error("MONGODB_URI is required. Add it to apps/api/.env before starting the API.");
        }
        if (config.MONGODB_DB_NAME && config.MONGODB_DB_NAME !== "saving_100_app") {
          throw new Error("MONGODB_DB_NAME must be saving_100_app.");
        }
        return config;
      },
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    ScheduleModule.forRoot(),
    DatabaseModule,
    AuthModule,
    ChallengesModule,
    SavingPlansModule,
    PaymentsModule,
    PushModule,
  ],
  controllers: [HealthController, DatabaseHealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
