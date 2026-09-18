import { PaymentMethod, Recurrence, ExpenseStatus } from '@prisma/client';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Matches, MaxLength, Min, MinLength } from 'class-validator';
import { EXPENSE_CATEGORY_IDS } from '../../common/constants/categories';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export class UpdateExpenseDto {
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
  @Matches(ISO_DATE, { message: 'date must be an ISO date (yyyy-MM-dd)' })
  date?: string;

  @IsOptional()
  @IsIn(EXPENSE_CATEGORY_IDS)
  categoryId?: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsEnum(ExpenseStatus)
  status?: ExpenseStatus;

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
}
