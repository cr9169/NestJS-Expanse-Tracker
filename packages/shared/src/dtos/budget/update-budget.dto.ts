import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpdateBudgetDto {
  @ApiPropertyOptional({
    description: 'New monthly spending limit in cents',
    example: 75000,
    minimum: 1,
    maximum: 100_000_00,
  })
  @IsOptional()
  @IsInt({ message: 'monthlyLimitCents must be an integer (no decimals)' })
  @Min(1, { message: 'Monthly limit must be at least 1 cent' })
  @Max(100_000_00, { message: 'Monthly limit exceeds maximum allowed value' })
  @Type(() => Number)
  monthlyLimitCents?: number;
}
