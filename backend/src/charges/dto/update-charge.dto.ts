import { ChargeStatus, Recurrence } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength } from 'class-validator';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export class UpdateChargeDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  clientName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  amount?: number;

  @IsOptional()
  @Matches(ISO_DATE, { message: 'dueDate must be an ISO date (yyyy-MM-dd)' })
  dueDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsOptional()
  @IsEnum(Recurrence)
  recurrence?: Recurrence;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(60)
  recurrenceCount?: number;

  /** Only 'pending' or 'canceled' — receiving a charge goes through POST /charges/:id/settle, which also books the income atomically. */
  @IsOptional()
  @IsEnum(ChargeStatus)
  status?: ChargeStatus;
}
