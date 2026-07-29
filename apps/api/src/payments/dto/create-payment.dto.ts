import { IsString, IsUUID } from "class-validator";

export class CreatePaymentDto {
  @IsString()
  slotId!: string;

  @IsUUID()
  idempotencyKey!: string;
}
