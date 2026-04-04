import { Controller, Get, Inject, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

import { TCP_PATTERNS } from '@shared/constants/tcp-patterns.constants';
import { TrendsQueryDto } from '@shared/dtos/analytics/trends-query.dto';
import { BreakdownQueryDto } from '@shared/dtos/analytics/breakdown-query.dto';
import type { JwtPayload } from '@shared/types/jwt-payload.type';

import { CurrentUser } from '../common/decorators/current-user.decorator';

import { ANALYTICS_CLIENT_TOKEN } from './tokens';

@ApiTags('analytics')
@ApiBearerAuth()
@Controller('api/v1/analytics')
export class AnalyticsController {
  constructor(
    @Inject(ANALYTICS_CLIENT_TOKEN) private readonly client: ClientProxy,
  ) {}

  @Get('trends')
  async trends(
    @CurrentUser() user: JwtPayload,
    @Query() query: TrendsQueryDto,
  ): Promise<unknown> {
    return firstValueFrom(
      this.client.send(TCP_PATTERNS.ANALYTICS_TRENDS, {
        userId: user.sub,
        months: query.months,
      }),
    );
  }

  @Get('breakdown')
  async breakdown(
    @CurrentUser() user: JwtPayload,
    @Query() query: BreakdownQueryDto,
  ): Promise<unknown> {
    return firstValueFrom(
      this.client.send(TCP_PATTERNS.ANALYTICS_BREAKDOWN, {
        userId: user.sub,
        month: query.month,
      }),
    );
  }

  @Get('anomalies')
  async anomalies(@CurrentUser() user: JwtPayload): Promise<unknown> {
    return firstValueFrom(
      this.client.send(TCP_PATTERNS.ANALYTICS_ANOMALIES, { userId: user.sub }),
    );
  }
}
