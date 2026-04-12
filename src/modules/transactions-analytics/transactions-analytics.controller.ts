import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { JwtAuthGuard } from '@/shared/guards/jwt-auth.guard.js';
import type { AuthenticatedRequest } from '@/modules/auth/auth.types.js';

import { AnalyticsQueryDto } from './dtos/analytics-query.dto.js';
import { CategoryBreakdownResponseDto } from './dtos/category-breakdown-response.dto.js';
import { DailySpendingQueryDto } from './dtos/daily-spending-query.dto.js';
import { DailySpendingResponseDto } from './dtos/daily-spending-response.dto.js';
import { SummaryResponseDto } from './dtos/summary-response.dto.js';
import { TopCategoriesQueryDto } from './dtos/top-categories-query.dto.js';
import { TopCategoriesResponseDto } from './dtos/top-categories-response.dto.js';
import { TrendsQueryDto } from './dtos/trends-query.dto.js';
import { TrendsResponseDto } from './dtos/trends-response.dto.js';
import { TransactionsAnalyticsService } from './transactions-analytics.service.js';
import type {
  CategoryBreakdownResponse,
  DailySpendingResponse,
  SummaryResponse,
  TopCategoriesResponse,
  TrendsResponse,
} from './transactions-analytics.types.js';

@ApiTags('Transactions Analytics')
@Controller('transactions-analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Unauthorized' })
@Throttle({ default: { limit: 10, ttl: 60000 } })
export class TransactionsAnalyticsController {
  constructor(private readonly transactionsAnalyticsService: TransactionsAnalyticsService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get financial summary' })
  @ApiResponse({ status: 200, type: SummaryResponseDto })
  async getSummary(
    @Query() query: AnalyticsQueryDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<SummaryResponse> {
    return this.transactionsAnalyticsService.getSummary({
      userId: req.user.id,
      currencyCode: query.currencyCode,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      type: query.type,
      categoryId: query.categoryId,
    });
  }

  @Get('category-breakdown')
  @ApiOperation({ summary: 'Get spending/income by category' })
  @ApiResponse({ status: 200, type: CategoryBreakdownResponseDto })
  async getCategoryBreakdown(
    @Query() query: AnalyticsQueryDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<CategoryBreakdownResponse> {
    return this.transactionsAnalyticsService.getCategoryBreakdown({
      userId: req.user.id,
      currencyCode: query.currencyCode,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      type: query.type,
      categoryId: query.categoryId,
    });
  }

  @Get('trends')
  @ApiOperation({ summary: 'Get income/expense trends over time' })
  @ApiResponse({ status: 200, type: TrendsResponseDto })
  async getTrends(
    @Query() query: TrendsQueryDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<TrendsResponse> {
    return this.transactionsAnalyticsService.getTrends({
      userId: req.user.id,
      currencyCode: query.currencyCode,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      type: query.type,
      categoryId: query.categoryId,
      granularity: query.granularity,
    });
  }

  @Get('top-categories')
  @ApiOperation({ summary: 'Get top spending/income categories' })
  @ApiResponse({ status: 200, type: TopCategoriesResponseDto })
  async getTopCategories(
    @Query() query: TopCategoriesQueryDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<TopCategoriesResponse> {
    return this.transactionsAnalyticsService.getTopCategories({
      userId: req.user.id,
      currencyCode: query.currencyCode,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      type: query.type,
      categoryId: query.categoryId,
      limit: query.limit,
    });
  }

  @Get('daily-spending')
  @ApiOperation({ summary: 'Get daily spending totals for a month' })
  @ApiResponse({ status: 200, type: DailySpendingResponseDto })
  async getDailySpending(
    @Query() query: DailySpendingQueryDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<DailySpendingResponse> {
    return this.transactionsAnalyticsService.getDailySpending({
      userId: req.user.id,
      currencyCode: query.currencyCode,
      year: query.year,
      month: query.month,
      type: query.type,
    });
  }
}
