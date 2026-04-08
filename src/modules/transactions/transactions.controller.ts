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
  Res,
  StreamableFile,
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
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';

import { MessageResponseDto } from '@/shared/dtos/message-response.dto.js';
import { buildPaginatedResponse } from '@/shared/utils/pagination.utils.js';
import { ErrorCode } from '@/shared/enums/error-code.enum.js';
import { JwtAuthGuard } from '@/shared/guards/index.js';
import type { AuthenticatedRequest } from '@/modules/auth/auth.types.js';

import { CreateTransactionDto } from './dtos/create-transaction.dto.js';
import { ExportTransactionQueryDto } from './dtos/export-transaction-query.dto.js';
import { ImportTransactionResponseDto } from './dtos/import-transaction-response.dto.js';
import { TransactionListResponseDto } from './dtos/transaction-list-response.dto.js';
import { TransactionQueryDto } from './dtos/transaction-query.dto.js';
import { TransactionResponseDto } from './dtos/transaction-response.dto.js';
import { TransactionsByCategoryResponseDto } from './dtos/transactions-by-category-response.dto.js';
import { UpdateTransactionDto } from './dtos/update-transaction.dto.js';
import { TransactionImportService } from './transaction-import.service.js';
import { TransactionsService } from './transactions.service.js';

@ApiTags('Transactions')
@Controller('transactions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly transactionImportService: TransactionImportService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List transactions' })
  @ApiResponse({ status: 200, type: TransactionListResponseDto })
  async findAll(@Query() query: TransactionQueryDto, @Request() req: AuthenticatedRequest) {
    const result = await this.transactionsService.findAll({
      userId: req.user.id,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 20,
      type: query.type,
      categoryId: query.categoryId,
      currencyCode: query.currencyCode,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    return buildPaginatedResponse(query, result);
  }

  @Get('by-category/:categoryId')
  @ApiOperation({ summary: 'Get transactions grouped by subcategory' })
  @ApiResponse({ status: 200, type: TransactionsByCategoryResponseDto })
  @ApiResponse({ status: 400, description: 'Category is a subcategory' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findByCategory(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.transactionsService.getTransactionsByCategory(categoryId, req.user.id);
  }

  @Get('export')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Export transactions as JSON or CSV file' })
  @ApiResponse({ status: 200, description: 'File download' })
  @ApiResponse({ status: 400, description: 'Invalid format or query parameters' })
  async exportTransactions(
    @Query() query: ExportTransactionQueryDto,
    @Request() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile | string> {
    const result = await this.transactionsService.exportTransactions({
      userId: req.user.id,
      format: query.format,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      categoryId: query.categoryId,
    });

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);

    if (result.isTruncated) {
      res.setHeader('X-Result-Truncated', 'true');
    }

    if ('stream' in result) {
      return new StreamableFile(result.stream);
    }

    return result.content;
  }

  @Post('import')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
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
    @Request() req: AuthenticatedRequest,
  ) {
    if (!file) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: 'File is required. Upload a .json or .csv file',
      });
    }

    return this.transactionImportService.importTransactions(file, req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a transaction' })
  @ApiResponse({ status: 200, type: TransactionResponseDto })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async findById(@Param('id', ParseUUIDPipe) id: string, @Request() req: AuthenticatedRequest) {
    return this.transactionsService.findById(id, req.user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a transaction' })
  @ApiResponse({ status: 201, type: TransactionResponseDto })
  @ApiResponse({ status: 400, description: 'Category type mismatch' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async create(@Body() dto: CreateTransactionDto, @Request() req: AuthenticatedRequest) {
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
    @Request() req: AuthenticatedRequest,
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
  async delete(@Param('id', ParseUUIDPipe) id: string, @Request() req: AuthenticatedRequest) {
    await this.transactionsService.delete(id, req.user.id);

    return { message: 'Transaction deleted successfully' };
  }
}
