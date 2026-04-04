import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, Matches } from 'class-validator';

export class BudgetStatusQueryDto {
  @ApiPropertyOptional({
    description: 'Month in YYYY-MM format. Defaults to current month.',
    example: '2026-04',
  })
  @IsOptional()
  @Matches(/^\d{4}-(?:0[1-9]|1[0-2])$/, {
    message: 'month must be in YYYY-MM format',
  })
  month?: string;
}
