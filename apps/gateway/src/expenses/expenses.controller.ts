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
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

import { TCP_PATTERNS } from '@shared/constants/tcp-patterns.constants';
import { CreateExpenseDto } from '@shared/dtos/expense/create-expense.dto';
import { UpdateExpenseDto } from '@shared/dtos/expense/update-expense.dto';
import { ListExpensesQueryDto } from '@shared/dtos/expense/list-expenses-query.dto';
import { ExpenseSummaryQueryDto } from '@shared/dtos/expense/expense-summary-query.dto';
import type { JwtPayload } from '@shared/types/jwt-payload.type';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

import { EXPENSES_CLIENT_TOKEN } from './tokens';

/**
 * ARCHITECTURE NOTE:
 * The gateway expenses controller contains ZERO business logic. It:
 * 1. Validates the request (ValidationPipe handles this globally)
 * 2. Extracts the authenticated user from the JWT via @CurrentUser()
 * 3. Forwards to the expenses-service via TCP with firstValueFrom()
 * 4. Returns the result — wrapping happens in TransformInterceptor
 *
 * This strict separation means the gateway can be replaced (e.g. GraphQL,
 * gRPC) without touching any business logic. The service owns the logic;
 * the gateway owns the protocol translation.
 */
@ApiTags('expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/expenses')
export class ExpensesController {
  constructor(
    @Inject(EXPENSES_CLIENT_TOKEN)
    private readonly client: ClientProxy,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new expense' })
  @ApiBody({ type: CreateExpenseDto })
  @ApiResponse({ status: 201, description: 'Expense created' })
  @ApiResponse({ status: 400, description: 'Invalid amount or domain invariant violation' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateExpenseDto,
  ): Promise<unknown> {
    return firstValueFrom(
      this.client.send(TCP_PATTERNS.EXPENSES_CREATE, { userId: user.sub, dto }),
    );
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get spending totals grouped by category' })
  @ApiQuery({ name: 'from', required: true, example: '2026-01-01' })
  @ApiQuery({ name: 'to', required: true, example: '2026-12-31' })
  @ApiResponse({ status: 200, description: 'Category summaries' })
  async getSummary(
    @CurrentUser() user: JwtPayload,
    @Query() dto: ExpenseSummaryQueryDto,
  ): Promise<unknown> {
    return firstValueFrom(
      this.client.send(TCP_PATTERNS.EXPENSES_SUMMARY, { userId: user.sub, dto }),
    );
  }

  @Get()
  @ApiOperation({ summary: 'List expenses with optional filters and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated list of expenses' })
  async list(
    @CurrentUser() user: JwtPayload,
    @Query() filters: ListExpensesQueryDto,
  ): Promise<unknown> {
    return firstValueFrom(
      this.client.send(TCP_PATTERNS.EXPENSES_LIST, { userId: user.sub, filters }),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single expense by ID' })
  @ApiParam({ name: 'id', description: 'Expense UUID' })
  @ApiResponse({ status: 200, description: 'Expense found' })
  @ApiResponse({ status: 404, description: 'Expense not found' })
  async findById(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<unknown> {
    return firstValueFrom(
      this.client.send(TCP_PATTERNS.EXPENSES_FIND_BY_ID, { id, userId: user.sub }),
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an expense (partial update)' })
  @ApiParam({ name: 'id', description: 'Expense UUID' })
  @ApiBody({ type: UpdateExpenseDto })
  @ApiResponse({ status: 200, description: 'Expense updated' })
  @ApiResponse({ status: 404, description: 'Expense not found' })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateExpenseDto,
  ): Promise<unknown> {
    return firstValueFrom(
      this.client.send(TCP_PATTERNS.EXPENSES_UPDATE, { id, userId: user.sub, dto }),
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an expense' })
  @ApiParam({ name: 'id', description: 'Expense UUID' })
  @ApiResponse({ status: 204, description: 'Expense deleted' })
  @ApiResponse({ status: 404, description: 'Expense not found' })
  async delete(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<void> {
    await firstValueFrom(
      this.client.send<void>(TCP_PATTERNS.EXPENSES_DELETE, { id, userId: user.sub }),
    );
  }
}
