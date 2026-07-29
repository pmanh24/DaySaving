import { Module, forwardRef } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { SavingPlansModule } from "../saving-plans/saving-plans.module";
import { PayosModule } from "./payos/payos.module";
import { PaymentsController } from "./payments.controller";
import { PaymentsRepository } from "./payments.repository";
import { PaymentsService } from "./payments.service";

@Module({ imports: [AuthModule, SavingPlansModule, forwardRef(() => PayosModule)], controllers: [PaymentsController], providers: [PaymentsRepository, PaymentsService], exports: [PaymentsService] })
export class PaymentsModule {}
