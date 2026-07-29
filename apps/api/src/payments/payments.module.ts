import { Module, forwardRef } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { ChallengesModule } from "../challenges/challenges.module";
import { SavingPlansModule } from "../saving-plans/saving-plans.module";
import { PayosModule } from "./payos/payos.module";
import { ChallengePaymentsController } from "./challenge-payments.controller";
import { ChallengePaymentsService } from "./challenge-payments.service";
import { PaymentsController } from "./payments.controller";
import { PaymentsRepository } from "./payments.repository";
import { PaymentsService } from "./payments.service";

@Module({ imports: [AuthModule, SavingPlansModule, forwardRef(() => ChallengesModule), forwardRef(() => PayosModule)], controllers: [PaymentsController, ChallengePaymentsController], providers: [PaymentsRepository, PaymentsService, ChallengePaymentsService], exports: [PaymentsService, ChallengePaymentsService] })
export class PaymentsModule {}
