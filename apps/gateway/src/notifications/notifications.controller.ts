import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

import { TCP_PATTERNS } from '@shared/constants/tcp-patterns.constants';
import { ListNotificationsQueryDto } from '@shared/dtos/notification/list-notifications-query.dto';
import type { JwtPayload } from '@shared/types/jwt-payload.type';

import { CurrentUser } from '../common/decorators/current-user.decorator';

import { NOTIFICATION_CLIENT_TOKEN } from './tokens';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('api/v1/notifications')
export class NotificationsController {
  constructor(
    @Inject(NOTIFICATION_CLIENT_TOKEN) private readonly client: ClientProxy,
  ) {}

  @Get()
  async list(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListNotificationsQueryDto,
  ): Promise<unknown> {
    return firstValueFrom(
      this.client.send(TCP_PATTERNS.NOTIFICATIONS_LIST, {
        userId: user.sub,
        page: query.page,
        limit: query.limit,
        unreadOnly: query.unreadOnly,
      }),
    );
  }

  @Get('unread-count')
  async unreadCount(@CurrentUser() user: JwtPayload): Promise<unknown> {
    return firstValueFrom(
      this.client.send(TCP_PATTERNS.NOTIFICATIONS_UNREAD_COUNT, { userId: user.sub }),
    );
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markAllRead(@CurrentUser() user: JwtPayload): Promise<void> {
    await firstValueFrom(
      this.client.send<void>(TCP_PATTERNS.NOTIFICATIONS_MARK_ALL_READ, { userId: user.sub }),
      { defaultValue: undefined },
    );
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markRead(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<void> {
    await firstValueFrom(
      this.client.send<void>(TCP_PATTERNS.NOTIFICATIONS_MARK_READ, { id, userId: user.sub }),
      { defaultValue: undefined },
    );
  }
}
