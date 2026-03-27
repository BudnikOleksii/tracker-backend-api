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
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Roles } from '@/shared/decorators/roles.decorator.js';
import { UseEnvelope } from '@/shared/decorators/use-envelope.decorator.js';
import { JwtAuthGuard, RolesGuard } from '@/shared/guards/index.js';
import type { UserRole } from '@/shared/enums/role.enum.js';

import { AssignRoleDto } from './dtos/assign-role.dto.js';
import { CreateUserDto } from './dtos/create-user.dto.js';
import { UpdateUserDto } from './dtos/update-user.dto.js';
import { UserListResponseDto } from './dtos/user-list-response.dto.js';
import { UserQueryDto } from './dtos/user-query.dto.js';
import { UserResponseDto } from './dtos/user-response.dto.js';
import { UserSummaryResponseDto } from './dtos/user-summary-response.dto.js';
import { UserService } from './user.service.js';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @UseEnvelope()
  @ApiOperation({ summary: 'Get user list' })
  @ApiResponse({ status: 200, type: UserListResponseDto })
  async findAll(@Query() query: UserQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const result = await this.userService.findAll({
      page,
      pageSize,
      search: query.search,
      role: query.role,
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

  @Get('summary')
  @ApiOperation({ summary: 'Get user summary statistics' })
  @ApiResponse({ status: 200, type: UserSummaryResponseDto })
  async getSummary() {
    return this.userService.getSummary();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user details' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create user' })
  @ApiResponse({ status: 201, type: UserResponseDto })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  async create(@Body() dto: CreateUserDto) {
    return this.userService.create({
      email: dto.email,
      password: dto.password,
      role: dto.role,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto) {
    return this.userService.update(id, {
      role: dto.role,
    });
  }

  @Put(':id/role')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign user role (ADMIN only)' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async assignRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignRoleDto,
    @Request() req: { user: { id: string; role: UserRole } },
  ) {
    return this.userService.assignRole(id, dto.role, req.user.id, req.user.role);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 204, description: 'Deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.userService.delete(id);
  }
}
