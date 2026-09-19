import { Recurrence } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength } from 'class-validator';

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

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(60)
  recurrenceCount?: number;

  /** Defaults to 'received' when omitted — new charges are booked as already received unless the caller opts into 'pending'. */
  @IsOptional()
  @IsIn(['pending', 'received'])
  status?: 'pending' | 'received';
}
