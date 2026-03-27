import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class ExpenseSummaryQueryDto {
  @ApiProperty({ description: 'Start date (inclusive) ISO 8601', example: '2026-01-01' })
  @IsDateString()
  from!: string;

  @ApiProperty({ description: 'End date (inclusive) ISO 8601', example: '2026-12-31' })
  @IsDateString()
  to!: string;
}
