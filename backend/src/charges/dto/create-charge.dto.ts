import { Recurrence } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Matches, MaxLength, Min, MinLength } from 'class-validator';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export class CreateChargeDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  clientName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(160)
  description!: string;

  @IsInt()
  @Min(1)
  amount!: number;

  @Matches(ISO_DATE, { message: 'dueDate must be an ISO date (yyyy-MM-dd)' })
  dueDate!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsEnum(Recurrence)
  recurrence!: Recurrence;
}
