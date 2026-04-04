import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class TrendsQueryDto {
  @ApiPropertyOptional({
    description: 'Number of months to look back',
    default: 6,
    minimum: 1,
    maximum: 24,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(24)
  @Type(() => Number)
  months: number = 6;
}
