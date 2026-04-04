import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';

export class BreakdownQueryDto {
  @ApiProperty({
    description: 'Month in YYYY-MM format',
    example: '2026-03',
  })
  @Matches(/^\d{4}-(?:0[1-9]|1[0-2])$/, {
    message: 'month must be in YYYY-MM format',
  })
  month!: string;
}
