import {
  BadRequestException,
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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { UseEnvelope } from '@/shared/decorators/use-envelope.decorator.js';
import { MessageResponseDto } from '@/shared/dtos/message-response.dto.js';
import { ErrorCode } from '@/shared/enums/error-code.enum.js';
import { JwtAuthGuard } from '@/shared/guards/index.js';

import { CreateTransactionDto } from './dtos/create-transaction.dto.js';
import { ImportTransactionResponseDto } from './dtos/import-transaction-response.dto.js';
import { TransactionListResponseDto } from './dtos/transaction-list-response.dto.js';
import { TransactionQueryDto } from './dtos/transaction-query.dto.js';
import { TransactionResponseDto } from './dtos/transaction-response.dto.js';
import { TransactionsByCategoryResponseDto } from './dtos/transactions-by-category-response.dto.js';
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
  @ApiResponse({ status: 200, type: TransactionListResponseDto })
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
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
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

  @Get('by-category/:categoryId')
  @ApiOperation({ summary: 'Get transactions grouped by subcategory' })
  @ApiResponse({ status: 200, type: TransactionsByCategoryResponseDto })
  @ApiResponse({ status: 400, description: 'Category is a subcategory' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findByCategory(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.transactionsService.getTransactionsByCategory(categoryId, req.user.id);
  }

  @Post('import')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Import transactions from JSON or CSV file' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'JSON or CSV file' },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 201, type: ImportTransactionResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid file format or data' })
  async importTransactions(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Request() req: { user: { id: string } },
  ) {
    if (!file) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: 'File is required. Upload a .json or .csv file',
      });
    }

    return this.transactionsService.importTransactions(file, req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a transaction' })
  @ApiResponse({ status: 200, type: TransactionResponseDto })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async findById(@Param('id', ParseUUIDPipe) id: string, @Request() req: { user: { id: string } }) {
    return this.transactionsService.findById(id, req.user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a transaction' })
  @ApiResponse({ status: 201, type: TransactionResponseDto })
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
  @ApiResponse({ status: 200, type: TransactionResponseDto })
  @ApiResponse({ status: 400, description: 'Category type mismatch' })
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
  @ApiResponse({ status: 200, type: MessageResponseDto })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async delete(@Param('id', ParseUUIDPipe) id: string, @Request() req: { user: { id: string } }) {
    await this.transactionsService.delete(id, req.user.id);

    return { message: 'Transaction deleted successfully' };
  }
}
