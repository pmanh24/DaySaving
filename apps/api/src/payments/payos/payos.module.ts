import { Module, forwardRef } from "@nestjs/common";
import { PaymentsModule } from "../payments.module";
import { PayosWebhookController } from "./payos-webhook.controller";
import { PayosService } from "./payos.service";

@Module({ imports: [forwardRef(() => PaymentsModule)], controllers: [PayosWebhookController], providers: [PayosService], exports: [PayosService] })
export class PayosModule {}
