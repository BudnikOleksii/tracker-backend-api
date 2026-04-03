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
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Roles } from '@/shared/decorators/roles.decorator.js';
import { UseEnvelope } from '@/shared/decorators/use-envelope.decorator.js';
import { MessageResponseDto } from '@/shared/dtos/message-response.dto.js';
import { JwtAuthGuard, RolesGuard } from '@/shared/guards/index.js';

import { CreateDefaultTransactionCategoryDto } from './dtos/create-default-transaction-category.dto.js';
import { DefaultTransactionCategoryListResponseDto } from './dtos/default-transaction-category-list-response.dto.js';
import { DefaultTransactionCategoryQueryDto } from './dtos/default-transaction-category-query.dto.js';
import { DefaultTransactionCategoryResponseDto } from './dtos/default-transaction-category-response.dto.js';
import { UpdateDefaultTransactionCategoryDto } from './dtos/update-default-transaction-category.dto.js';
import { DefaultTransactionCategoriesService } from './default-transaction-categories.service.js';

@ApiTags('Default Transaction Categories')
@Controller('default-transaction-categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class DefaultTransactionCategoriesController {
  constructor(private readonly service: DefaultTransactionCategoriesService) {}

  @Get()
  @UseEnvelope()
  @ApiOperation({ summary: 'List default transaction categories' })
  @ApiResponse({ status: 200, type: DefaultTransactionCategoryListResponseDto })
  async findAll(@Query() query: DefaultTransactionCategoryQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const result = await this.service.findAll({
      page,
      pageSize,
      type: query.type,
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
  @ApiOperation({ summary: 'Get a default transaction category' })
  @ApiResponse({ status: 200, type: DefaultTransactionCategoryResponseDto })
  @ApiResponse({ status: 404, description: 'Default transaction category not found' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a default transaction category' })
  @ApiResponse({ status: 201, type: DefaultTransactionCategoryResponseDto })
  @ApiResponse({ status: 409, description: 'Duplicate default transaction category' })
  async create(@Body() dto: CreateDefaultTransactionCategoryDto) {
    return this.service.create({
      name: dto.name,
      type: dto.type,
      parentDefaultTransactionCategoryId: dto.parentDefaultTransactionCategoryId,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a default transaction category' })
  @ApiResponse({ status: 200, type: DefaultTransactionCategoryResponseDto })
  @ApiResponse({ status: 404, description: 'Default transaction category not found' })
  @ApiResponse({ status: 409, description: 'Duplicate default transaction category' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDefaultTransactionCategoryDto,
  ) {
    return this.service.update(id, {
      name: dto.name,
      parentDefaultTransactionCategoryId: dto.parentDefaultTransactionCategoryId,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a default transaction category' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  @ApiResponse({ status: 404, description: 'Default transaction category not found' })
  @ApiResponse({ status: 409, description: 'Default transaction category has subcategories' })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.delete(id);

    return { message: 'Default transaction category deleted successfully' };
  }
}
