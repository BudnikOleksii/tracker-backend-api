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

import { MessageResponseDto } from '@/shared/dtos/message-response.dto.js';
import { buildPaginatedResponse } from '@/shared/utils/pagination.utils.js';
import { JwtAuthGuard } from '@/shared/guards/index.js';
import type { AuthenticatedRequest } from '@/modules/auth/auth.types.js';

import { CategoryListResponseDto } from './dtos/category-list-response.dto.js';
import { CategoryQueryDto } from './dtos/category-query.dto.js';
import { CategoryResponseDto } from './dtos/category-response.dto.js';
import { CreateCategoryDto } from './dtos/create-category.dto.js';
import { UpdateCategoryDto } from './dtos/update-category.dto.js';
import { TransactionCategoriesService } from './transaction-categories.service.js';

@ApiTags('Transaction Categories')
@Controller('transaction-categories')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Unauthorized' })
export class TransactionCategoriesController {
  constructor(private readonly categoriesService: TransactionCategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'List transaction categories' })
  @ApiResponse({ status: 200, type: CategoryListResponseDto })
  async findAll(@Query() query: CategoryQueryDto, @Request() req: AuthenticatedRequest) {
    const result = await this.categoriesService.findAll({
      userId: req.user.id,
      page: query.page,
      pageSize: query.pageSize,
      type: query.type,
      parentCategoryId: query.parentCategoryId,
      root: query.root,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    return buildPaginatedResponse(query, result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a transaction category' })
  @ApiResponse({ status: 200, type: CategoryResponseDto })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findById(@Param('id', ParseUUIDPipe) id: string, @Request() req: AuthenticatedRequest) {
    return this.categoriesService.findById(id, req.user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a transaction category' })
  @ApiResponse({ status: 201, type: CategoryResponseDto })
  @ApiResponse({ status: 409, description: 'Duplicate category' })
  async create(@Body() dto: CreateCategoryDto, @Request() req: AuthenticatedRequest) {
    return this.categoriesService.create({
      userId: req.user.id,
      name: dto.name,
      type: dto.type,
      parentCategoryId: dto.parentCategoryId,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a transaction category' })
  @ApiResponse({ status: 200, type: CategoryResponseDto })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 409, description: 'Duplicate category' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.categoriesService.update(id, req.user.id, {
      name: dto.name,
      parentCategoryId: dto.parentCategoryId,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a transaction category' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 409, description: 'Category has transactions' })
  async delete(@Param('id', ParseUUIDPipe) id: string, @Request() req: AuthenticatedRequest) {
    await this.categoriesService.delete(id, req.user.id);

    return { message: 'Category deleted successfully' };
  }
}
