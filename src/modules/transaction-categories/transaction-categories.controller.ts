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
export class TransactionCategoriesController {
  constructor(private readonly categoriesService: TransactionCategoriesService) {}

  @Get()
  @UseEnvelope()
  @ApiOperation({ summary: 'List transaction categories' })
  @ApiResponse({ status: 200, type: CategoryListResponseDto })
  async findAll(@Query() query: CategoryQueryDto, @Request() req: { user: { id: string } }) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const result = await this.categoriesService.findAll({
      userId: req.user.id,
      page,
      pageSize,
      type: query.type,
      parentCategoryId: query.parentCategoryId,
      root: query.root,
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
  @ApiOperation({ summary: 'Get a transaction category' })
  @ApiResponse({ status: 200, type: CategoryResponseDto })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findById(@Param('id', ParseUUIDPipe) id: string, @Request() req: { user: { id: string } }) {
    return this.categoriesService.findById(id, req.user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a transaction category' })
  @ApiResponse({ status: 201, type: CategoryResponseDto })
  @ApiResponse({ status: 409, description: 'Duplicate category' })
  async create(@Body() dto: CreateCategoryDto, @Request() req: { user: { id: string } }) {
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
    @Request() req: { user: { id: string } },
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
  async delete(@Param('id', ParseUUIDPipe) id: string, @Request() req: { user: { id: string } }) {
    await this.categoriesService.delete(id, req.user.id);

    return { message: 'Category deleted successfully' };
  }
}
