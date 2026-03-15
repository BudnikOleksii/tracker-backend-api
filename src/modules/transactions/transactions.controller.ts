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

import { CreateTransactionDto } from './dtos/create-transaction.dto.js';
import { TransactionQueryDto } from './dtos/transaction-query.dto.js';
import { UpdateTransactionDto } from './dtos/update-transaction.dto.js';
import { TransactionsService } from './transactions.service.js';

@ApiTags('Transactions')
@Controller('transactions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @UseEnvelope()
  @ApiOperation({ summary: 'List transactions' })
  @ApiResponse({ status: 200 })
  async findAll(@Query() query: TransactionQueryDto, @Request() req: { user: { id: string } }) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const result = await this.transactionsService.findAll({
      userId: req.user.id,
      page,
      pageSize,
      type: query.type,
      categoryId: query.categoryId,
      currencyCode: query.currencyCode,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
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
  @ApiOperation({ summary: 'Get a transaction' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async findById(@Param('id', ParseUUIDPipe) id: string, @Request() req: { user: { id: string } }) {
    return this.transactionsService.findById(id, req.user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a transaction' })
  @ApiResponse({ status: 201 })
  @ApiResponse({ status: 400, description: 'Category type mismatch' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async create(@Body() dto: CreateTransactionDto, @Request() req: { user: { id: string } }) {
    return this.transactionsService.create({
      userId: req.user.id,
      categoryId: dto.categoryId,
      type: dto.type,
      amount: dto.amount,
      currencyCode: dto.currencyCode,
      date: new Date(dto.date),
      description: dto.description,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a transaction' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTransactionDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.transactionsService.update(id, req.user.id, {
      categoryId: dto.categoryId,
      type: dto.type,
      amount: dto.amount,
      currencyCode: dto.currencyCode,
      date: dto.date ? new Date(dto.date) : undefined,
      description: dto.description,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a transaction' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async delete(@Param('id', ParseUUIDPipe) id: string, @Request() req: { user: { id: string } }) {
    await this.transactionsService.delete(id, req.user.id);

    return { message: 'Transaction deleted successfully' };
  }
}
