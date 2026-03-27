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
import { MessageResponseDto } from '@/shared/dtos/message-response.dto.js';
import { JwtAuthGuard } from '@/shared/guards/index.js';

import { BudgetsService } from './budgets.service.js';
import { BudgetListResponseDto } from './dtos/budget-list-response.dto.js';
import { BudgetProgressResponseDto } from './dtos/budget-progress-response.dto.js';
import { BudgetQueryDto } from './dtos/budget-query.dto.js';
import { BudgetResponseDto } from './dtos/budget-response.dto.js';
import { CreateBudgetDto } from './dtos/create-budget.dto.js';
import { UpdateBudgetDto } from './dtos/update-budget.dto.js';

@ApiTags('Budgets')
@Controller('budgets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Get()
  @UseEnvelope()
  @ApiOperation({ summary: 'List budgets' })
  @ApiResponse({ status: 200, type: BudgetListResponseDto })
  async findAll(@Query() query: BudgetQueryDto, @Request() req: { user: { id: string } }) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const result = await this.budgetsService.findAll({
      userId: req.user.id,
      page,
      pageSize,
      status: query.status,
      period: query.period,
      categoryId: query.categoryId,
      currencyCode: query.currencyCode,
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
  @ApiOperation({ summary: 'Get a budget' })
  @ApiResponse({ status: 200, type: BudgetResponseDto })
  @ApiResponse({ status: 404, description: 'Budget not found' })
  async findById(@Param('id', ParseUUIDPipe) id: string, @Request() req: { user: { id: string } }) {
    return this.budgetsService.findById(id, req.user.id);
  }

  @Get(':id/progress')
  @ApiOperation({ summary: 'Get budget progress' })
  @ApiResponse({ status: 200, type: BudgetProgressResponseDto })
  @ApiResponse({ status: 404, description: 'Budget not found' })
  async getProgress(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.budgetsService.getProgress(id, req.user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a budget' })
  @ApiResponse({ status: 201, type: BudgetResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 409, description: 'Overlapping budget exists' })
  async create(@Body() dto: CreateBudgetDto, @Request() req: { user: { id: string } }) {
    return this.budgetsService.create({
      userId: req.user.id,
      categoryId: dto.categoryId,
      amount: dto.amount,
      currencyCode: dto.currencyCode,
      period: dto.period,
      startDate: new Date(dto.startDate),
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      description: dto.description,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a budget' })
  @ApiResponse({ status: 200, type: BudgetResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 404, description: 'Budget not found' })
  @ApiResponse({ status: 409, description: 'Overlapping budget exists' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBudgetDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.budgetsService.update(id, req.user.id, {
      amount: dto.amount,
      categoryId: dto.categoryId,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      description: dto.description,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a budget' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  @ApiResponse({ status: 404, description: 'Budget not found' })
  async delete(@Param('id', ParseUUIDPipe) id: string, @Request() req: { user: { id: string } }) {
    await this.budgetsService.delete(id, req.user.id);

    return { message: 'Budget deleted successfully' };
  }
}
