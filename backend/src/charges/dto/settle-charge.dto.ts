import { IsOptional, Matches } from 'class-validator';

export class SettleChargeDto {
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'receivedAt must be an ISO date (yyyy-MM-dd)' })
  receivedAt?: string;
}
