import { CategoryKind } from '@prisma/client';
import { IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

const HEX = /^#([0-9a-fA-F]{6})$/;

export class CreateCategoryDto {
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  name!: string;

  @IsEnum(CategoryKind)
  kind!: CategoryKind;

  @IsString()
  @MinLength(1)
  @MaxLength(40)
  icon!: string;

  @Matches(HEX, { message: 'color must be a hex color like #6366f1' })
  color!: string;
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  icon?: string;

  @IsOptional()
  @Matches(HEX, { message: 'color must be a hex color like #6366f1' })
  color?: string;
}
