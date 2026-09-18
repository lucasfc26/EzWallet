import { CardBrand, CardKind } from '@prisma/client';
import { IsEnum, IsOptional, Matches } from 'class-validator';

export class CreateCardDto {
  @IsEnum(CardBrand)
  brand!: CardBrand;

  @Matches(/^\d{4}$/, { message: 'last4 must be exactly 4 digits' })
  last4!: string;

  @IsEnum(CardKind)
  kind!: CardKind;
}

export class UpdateCardDto {
  @IsOptional()
  @IsEnum(CardBrand)
  brand?: CardBrand;

  @IsOptional()
  @Matches(/^\d{4}$/, { message: 'last4 must be exactly 4 digits' })
  last4?: string;

  @IsOptional()
  @IsEnum(CardKind)
  kind?: CardKind;
}
