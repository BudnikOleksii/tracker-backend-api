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
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'

import { Roles } from '@/shared/decorators/roles.decorator.js'
import { UseEnvelope } from '@/shared/decorators/use-envelope.decorator.js'
import { JwtAuthGuard, RolesGuard } from '@/shared/guards/index.js'

import { AssignRoleDto } from './dtos/assign-role.dto.js'
import { CreateUserDto } from './dtos/create-user.dto.js'
import { UpdateUserDto } from './dtos/update-user.dto.js'
import { UserQueryDto } from './dtos/user-query.dto.js'
import { UserService } from './user.service.js'

import type { RoleType } from '@/shared/enums/role.enum.js'

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
  @ApiResponse({ status: 200 })
  async findAll(@Query() query: UserQueryDto) {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20

    const result = await this.userService.findAll({
      page,
      pageSize,
      search: query.search,
      role: query.role,
      banned: query.banned,
    })

    const totalPages = Math.ceil(result.total / pageSize)

    return {
      object: 'list' as const,
      data: result.data,
      total: result.total,
      page,
      pageSize,
      hasMore: page < totalPages,
    }
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get user summary statistics' })
  async getSummary() {
    return this.userService.getSummary()
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user details' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.findById(id)
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create user' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  async create(@Body() dto: CreateUserDto) {
    return this.userService.create({
      name: dto.name,
      email: dto.email,
      password: dto.password,
      role: dto.role,
    })
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.userService.update(id, {
      name: dto.name,
      banned: dto.banned,
      banReason: dto.banReason,
    })
  }

  @Put(':id/role')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign user role (ADMIN only)' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async assignRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignRoleDto,
    @Request() req: { user: { id: string, role: RoleType } },
  ) {
    return this.userService.assignRole(id, dto.role, req.user.id, req.user.role)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 204, description: 'Deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.userService.delete(id)
  }
}
