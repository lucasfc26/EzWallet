import { PaymentMethod } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreatePaymentOptionDto {
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  name!: string;

  @IsEnum(PaymentMethod)
  method!: PaymentMethod;
}

export class UpdatePaymentOptionDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  name?: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;
}
