import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

import { ExpenseCategory } from '../../enums/expense-category.enum';

export class CreateBudgetDto {
  @ApiPropertyOptional({
    description: 'Category to budget. Omit for an overall (all-category) budget.',
    enum: ExpenseCategory,
    example: ExpenseCategory.FOOD,
  })
  @IsOptional()
  @IsEnum(ExpenseCategory)
  category?: ExpenseCategory;

  @ApiProperty({
    description: 'Monthly spending limit in cents (e.g. 50000 = $500.00)',
    example: 50000,
    minimum: 1,
    maximum: 100_000_00,
  })
  @IsInt({ message: 'monthlyLimitCents must be an integer (no decimals)' })
  @Min(1, { message: 'Monthly limit must be at least 1 cent' })
  @Max(100_000_00, { message: 'Monthly limit exceeds maximum allowed value' })
  @Type(() => Number)
  monthlyLimitCents!: number;

  @ApiPropertyOptional({
    description: 'ISO 4217 currency code',
    example: 'USD',
    default: 'USD',
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(3)
  currency: string = 'USD';
}
