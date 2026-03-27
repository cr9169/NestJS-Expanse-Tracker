import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import { ExpenseCategory } from '../../enums/expense-category.enum';

/**
 * DTO for creating a new expense.
 * Amount is expressed in cents (integer) — no floating point ever crosses
 * the API boundary. The client converts: $15.00 → amountCents: 1500.
 * This eliminates an entire class of rounding bugs before they can occur.
 */
export class CreateExpenseDto {
  @ApiProperty({
    description: 'Amount in cents (e.g. 1500 = $15.00)',
    example: 1500,
    minimum: 1,
    maximum: 100_000_00,
  })
  @IsInt({ message: 'amountCents must be an integer (no decimals)' })
  @Min(1, { message: 'Amount must be at least 1 cent' })
  @Max(100_000_00, { message: 'Amount exceeds maximum allowed value' })
  @Type(() => Number)
  amountCents!: number;

  @ApiProperty({
    description: 'ISO 4217 currency code',
    example: 'USD',
    default: 'USD',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(3)
  currency: string = 'USD';

  @ApiProperty({
    description: 'Expense category',
    enum: ExpenseCategory,
    example: ExpenseCategory.FOOD,
  })
  @IsEnum(ExpenseCategory)
  category!: ExpenseCategory;

  @ApiProperty({
    description: 'Human-readable description (max 500 chars)',
    example: 'Lunch at the deli',
    maxLength: 500,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  description!: string;

  @ApiProperty({
    description: 'Expense date in ISO 8601 format (YYYY-MM-DD)',
    example: '2026-03-27',
  })
  @IsDateString({}, { message: 'date must be a valid ISO date string (YYYY-MM-DD)' })
  date!: string;
}
