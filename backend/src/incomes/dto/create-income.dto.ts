import { Recurrence, IncomeStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min, MinLength } from 'class-validator';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export class CreateIncomeDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  description!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  amount!: number;

  @Matches(ISO_DATE, { message: 'date must be an ISO date (yyyy-MM-dd)' })
  date!: string;

  @IsUUID()
  categoryId!: string;

  @IsEnum(IncomeStatus)
  status!: IncomeStatus;

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
}
