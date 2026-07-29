import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { SavingPlansController } from "./saving-plans.controller";
import { SavingPlansService } from "./saving-plans.service";
import { SavingPlansStore } from "./saving-plans.store";

@Module({ imports: [AuthModule], controllers: [SavingPlansController], providers: [SavingPlansStore, SavingPlansService], exports: [SavingPlansStore, SavingPlansService] })
export class SavingPlansModule {}
