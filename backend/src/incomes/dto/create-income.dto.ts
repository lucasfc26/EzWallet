import { Recurrence, IncomeStatus } from '@prisma/client';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Matches, MaxLength, Min, MinLength } from 'class-validator';
import { INCOME_CATEGORY_IDS } from '../../common/constants/categories';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export class CreateIncomeDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  description!: string;

  @IsInt()
  @Min(1)
  amount!: number;

  @Matches(ISO_DATE, { message: 'date must be an ISO date (yyyy-MM-dd)' })
  date!: string;

  @IsIn(INCOME_CATEGORY_IDS)
  categoryId!: string;

  @IsEnum(IncomeStatus)
  status!: IncomeStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsEnum(Recurrence)
  recurrence!: Recurrence;
}
