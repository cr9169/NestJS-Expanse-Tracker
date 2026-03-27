import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import { ExpenseCategory } from '../../enums/expense-category.enum';

/**
 * All fields are optional — PATCH semantics.
 * We avoid using PartialType from @nestjs/mapped-types here to keep the shared
 * package free from NestJS framework deps (only @nestjs/swagger is acceptable
 * since it's a decorators-only concern).
 */
export class UpdateExpenseDto {
  @ApiPropertyOptional({ description: 'Amount in cents', example: 2000 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100_000_00)
  @Type(() => Number)
  amountCents?: number;

  @ApiPropertyOptional({ description: 'ISO 4217 currency code', example: 'USD' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({ enum: ExpenseCategory })
  @IsOptional()
  @IsEnum(ExpenseCategory)
  category?: ExpenseCategory;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: '2026-03-27' })
  @IsOptional()
  @IsDateString()
  date?: string;
}
