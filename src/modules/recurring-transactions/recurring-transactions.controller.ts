import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Roles } from '@/shared/decorators/roles.decorator.js';
import { BulkDeleteDto } from '@/shared/dtos/bulk-delete.dto.js';
import { BulkDeleteResponseDto } from '@/shared/dtos/bulk-delete-response.dto.js';
import { MessageResponseDto } from '@/shared/dtos/message-response.dto.js';
import { buildPaginatedResponse } from '@/shared/utils/pagination.utils.js';
import { JwtAuthGuard, RolesGuard } from '@/shared/guards/index.js';
import type { AuthenticatedRequest } from '@/modules/auth/auth.types.js';

import { CreateRecurringTransactionDto } from './dtos/create-recurring-transaction.dto.js';
import { ProcessResultResponseDto } from './dtos/process-result-response.dto.js';
import { RecurringTransactionListResponseDto } from './dtos/recurring-transaction-list-response.dto.js';
import { RecurringTransactionQueryDto } from './dtos/recurring-transaction-query.dto.js';
import { RecurringTransactionResponseDto } from './dtos/recurring-transaction-response.dto.js';
import { UpdateRecurringTransactionDto } from './dtos/update-recurring-transaction.dto.js';
import { RecurringTransactionsService } from './recurring-transactions.service.js';

@ApiTags('Recurring Transactions')
@Controller('recurring-transactions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Unauthorized' })
export class RecurringTransactionsController {
  constructor(private readonly recurringTransactionsService: RecurringTransactionsService) {}

  @Get()
  @ApiOperation({ summary: 'List recurring transactions' })
  @ApiResponse({ status: 200, type: RecurringTransactionListResponseDto })
  async findAll(
    @Query() query: RecurringTransactionQueryDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const result = await this.recurringTransactionsService.findAll({
      userId: req.user.id,
      page: query.page,
      pageSize: query.pageSize,
      status: query.status,
      type: query.type,
      categoryId: query.categoryId,
      currencyCode: query.currencyCode,
      frequency: query.frequency,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    return buildPaginatedResponse(query, result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a recurring transaction' })
  @ApiResponse({ status: 200, type: RecurringTransactionResponseDto })
  @ApiResponse({ status: 404, description: 'Recurring transaction not found' })
  async findById(@Param('id', ParseUUIDPipe) id: string, @Request() req: AuthenticatedRequest) {
    return this.recurringTransactionsService.findById(id, req.user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a recurring transaction' })
  @ApiResponse({ status: 201, type: RecurringTransactionResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async create(@Body() dto: CreateRecurringTransactionDto, @Request() req: AuthenticatedRequest) {
    return this.recurringTransactionsService.create({
      userId: req.user.id,
      categoryId: dto.categoryId,
      type: dto.type,
      amount: dto.amount,
      currencyCode: dto.currencyCode,
      description: dto.description,
      frequency: dto.frequency,
      interval: dto.interval ?? 1,
      startDate: new Date(dto.startDate),
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a recurring transaction' })
  @ApiResponse({ status: 200, type: RecurringTransactionResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 404, description: 'Recurring transaction not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRecurringTransactionDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.recurringTransactionsService.update(id, req.user.id, {
      categoryId: dto.categoryId,
      type: dto.type,
      amount: dto.amount,
      currencyCode: dto.currencyCode,
      description: dto.description,
      frequency: dto.frequency,
      interval: dto.interval,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
    });
  }

  @Delete('batch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk delete (cancel) recurring transactions' })
  @ApiResponse({ status: 200, type: BulkDeleteResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async bulkDelete(@Body() dto: BulkDeleteDto, @Request() req: AuthenticatedRequest) {
    return this.recurringTransactionsService.bulkDelete(dto.ids, req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete (cancel) a recurring transaction' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  @ApiResponse({ status: 404, description: 'Recurring transaction not found' })
  async delete(@Param('id', ParseUUIDPipe) id: string, @Request() req: AuthenticatedRequest) {
    await this.recurringTransactionsService.delete(id, req.user.id);

    return { message: 'Recurring transaction cancelled successfully' };
  }

  @Patch(':id/pause')
  @ApiOperation({ summary: 'Pause a recurring transaction' })
  @ApiResponse({ status: 200, type: RecurringTransactionResponseDto })
  @ApiResponse({ status: 400, description: 'Not active' })
  @ApiResponse({ status: 404, description: 'Recurring transaction not found' })
  async pause(@Param('id', ParseUUIDPipe) id: string, @Request() req: AuthenticatedRequest) {
    return this.recurringTransactionsService.pause(id, req.user.id);
  }

  @Patch(':id/resume')
  @ApiOperation({ summary: 'Resume a recurring transaction' })
  @ApiResponse({ status: 200, type: RecurringTransactionResponseDto })
  @ApiResponse({ status: 400, description: 'Not paused' })
  @ApiResponse({ status: 404, description: 'Recurring transaction not found' })
  async resume(@Param('id', ParseUUIDPipe) id: string, @Request() req: AuthenticatedRequest) {
    return this.recurringTransactionsService.resume(id, req.user.id);
  }

  @Post('process')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Process due recurring transactions' })
  @ApiResponse({ status: 200, type: ProcessResultResponseDto })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async process() {
    return this.recurringTransactionsService.processAllRecurringTransactions();
  }
}
