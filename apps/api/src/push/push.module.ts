import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PushSubscriptionDocument, PushSubscriptionSchema, UserDocument, UserSchema } from "../database/schemas";
import { MongooseModule } from "@nestjs/mongoose";
import { PushController } from "./push.controller";
import { PushService } from "./push.service";

@Module({
  imports: [AuthModule, MongooseModule.forFeature([{ name: PushSubscriptionDocument.name, schema: PushSubscriptionSchema }, { name: UserDocument.name, schema: UserSchema }])],
  controllers: [PushController],
  providers: [PushService],
  exports: [PushService],
})
export class PushModule {}
