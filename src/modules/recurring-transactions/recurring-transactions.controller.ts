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

import { UseEnvelope } from '@/shared/decorators/use-envelope.decorator.js';
import { JwtAuthGuard } from '@/shared/guards/index.js';

import { CreateRecurringTransactionDto } from './dtos/create-recurring-transaction.dto.js';
import { RecurringTransactionQueryDto } from './dtos/recurring-transaction-query.dto.js';
import { UpdateRecurringTransactionDto } from './dtos/update-recurring-transaction.dto.js';
import { RecurringTransactionsService } from './recurring-transactions.service.js';

@ApiTags('Recurring Transactions')
@Controller('recurring-transactions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RecurringTransactionsController {
  constructor(private readonly recurringTransactionsService: RecurringTransactionsService) {}

  @Get()
  @UseEnvelope()
  @ApiOperation({ summary: 'List recurring transactions' })
  @ApiResponse({ status: 200 })
  async findAll(
    @Query() query: RecurringTransactionQueryDto,
    @Request() req: { user: { id: string } },
  ) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const result = await this.recurringTransactionsService.findAll({
      userId: req.user.id,
      page,
      pageSize,
      status: query.status,
      type: query.type,
      categoryId: query.categoryId,
      currencyCode: query.currencyCode,
      frequency: query.frequency,
    });

    const totalPages = Math.ceil(result.total / pageSize);

    return {
      object: 'list' as const,
      data: result.data,
      total: result.total,
      page,
      pageSize,
      hasMore: page < totalPages,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a recurring transaction' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Recurring transaction not found' })
  async findById(@Param('id', ParseUUIDPipe) id: string, @Request() req: { user: { id: string } }) {
    return this.recurringTransactionsService.findById(id, req.user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a recurring transaction' })
  @ApiResponse({ status: 201 })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async create(
    @Body() dto: CreateRecurringTransactionDto,
    @Request() req: { user: { id: string } },
  ) {
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
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 404, description: 'Recurring transaction not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRecurringTransactionDto,
    @Request() req: { user: { id: string } },
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

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete (cancel) a recurring transaction' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Recurring transaction not found' })
  async delete(@Param('id', ParseUUIDPipe) id: string, @Request() req: { user: { id: string } }) {
    await this.recurringTransactionsService.delete(id, req.user.id);

    return { message: 'Recurring transaction cancelled successfully' };
  }

  @Patch(':id/pause')
  @ApiOperation({ summary: 'Pause a recurring transaction' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 400, description: 'Not active' })
  @ApiResponse({ status: 404, description: 'Recurring transaction not found' })
  async pause(@Param('id', ParseUUIDPipe) id: string, @Request() req: { user: { id: string } }) {
    return this.recurringTransactionsService.pause(id, req.user.id);
  }

  @Patch(':id/resume')
  @ApiOperation({ summary: 'Resume a recurring transaction' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 400, description: 'Not paused' })
  @ApiResponse({ status: 404, description: 'Recurring transaction not found' })
  async resume(@Param('id', ParseUUIDPipe) id: string, @Request() req: { user: { id: string } }) {
    return this.recurringTransactionsService.resume(id, req.user.id);
  }

  @Post('process')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process due recurring transactions' })
  @ApiResponse({ status: 200 })
  async process(@Request() req: { user: { id: string } }) {
    return this.recurringTransactionsService.processRecurringTransactions(req.user.id);
  }
}
