import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

import { TCP_PATTERNS } from '@shared/constants/tcp-patterns.constants';
import { CreateBudgetDto } from '@shared/dtos/budget/create-budget.dto';
import { UpdateBudgetDto } from '@shared/dtos/budget/update-budget.dto';
import { BudgetStatusQueryDto } from '@shared/dtos/budget/budget-status-query.dto';
import type { JwtPayload } from '@shared/types/jwt-payload.type';

import { CurrentUser } from '../common/decorators/current-user.decorator';

import { BUDGET_CLIENT_TOKEN } from './tokens';

@ApiTags('budgets')
@ApiBearerAuth()
@Controller('api/v1/budgets')
export class BudgetsController {
  constructor(
    @Inject(BUDGET_CLIENT_TOKEN) private readonly client: ClientProxy,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateBudgetDto,
  ): Promise<unknown> {
    return firstValueFrom(
      this.client.send(TCP_PATTERNS.BUDGETS_CREATE, { userId: user.sub, dto }),
    );
  }

  @Get()
  async list(@CurrentUser() user: JwtPayload): Promise<unknown> {
    return firstValueFrom(
      this.client.send(TCP_PATTERNS.BUDGETS_LIST, { userId: user.sub }),
    );
  }

  @Get('status')
  async status(
    @CurrentUser() user: JwtPayload,
    @Query() query: BudgetStatusQueryDto,
  ): Promise<unknown> {
    return firstValueFrom(
      this.client.send(TCP_PATTERNS.BUDGETS_STATUS, {
        userId: user.sub,
        month: query.month,
      }),
    );
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateBudgetDto,
  ): Promise<unknown> {
    return firstValueFrom(
      this.client.send(TCP_PATTERNS.BUDGETS_UPDATE, { id, userId: user.sub, dto }),
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<void> {
    await firstValueFrom(
      this.client.send<void>(TCP_PATTERNS.BUDGETS_DELETE, { id, userId: user.sub }),
    );
  }
}
