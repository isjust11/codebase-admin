import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { UserService } from '../services/user.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { User } from '../entities/user.entity';
import { RegisterDto } from '../dtos/auth.dto';
import { UpdateUserDto } from '../dtos/user.dto';
import { PermissionGuard } from '../guards/permission.guard';
import { RequirePermissions, RequirePermission, RequirePermissionsAction } from 'src/decorators/require-permissions.decorator';
import { PaginationParams } from 'src/dtos/filter.dto';
import { BaseController } from './base.controller';

@Controller('users')
@UseGuards(PermissionGuard)
@UseGuards(JwtAuthGuard)
export class UserController extends BaseController {
  constructor(private userService: UserService) {
    super();
  }

  @Get()
  @RequirePermission('READ', 'user')
  async getNavigator(@Query('page') page: number, @Query('size') size: number, @Query('search') search: string) {
    const filter: PaginationParams = {
      page: page || 1,
      size: size || 10,
      search: search || ''
    };
    return this.userService.findAllWithPagination(filter);
  }
  
  @Get('all')
  @RequirePermission('READ', 'user')
  async findAll(): Promise<User[]> {
    return this.userService.findAll();
  }

  @Get(':id')
  @RequirePermission('READ', 'user')
  async findOne(@Param('id') id: string): Promise<User | null> {
    return this.userService.findById(this.decode(id));
  }

  @Post()
  @RequirePermission('CREATE', 'user')
  async create(@Body() createUserDto: RegisterDto): Promise<User> {
    return this.userService.create(createUserDto);
  }

  @Put(':id')
  @RequirePermission('UPDATE', 'user')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.userService.update(this.decode(id), updateUserDto);
  }

  @Delete(':id')
  @RequirePermission('DELETE', 'user')
  async remove(@Param('id') id: string): Promise<void> {
    return this.userService.remove(this.decode(id));
  }

  @Put(':id/block')
  @RequirePermission('UPDATE', 'user')
  async blockUser(@Param('id') id: string): Promise<User> {
    return this.userService.blockUser(this.decode(id));
  }

  @Put(':id/unblock')
  @RequirePermission('UPDATE', 'user')
  async unblockUser(@Param('id') id: string): Promise<User> {
    return this.userService.unblockUser(this.decode(id));
  }

  // Ví dụ sử dụng RequirePermissionsAction cho nhiều permission
  @Get(':id/profile')
  @RequirePermissionsAction(
    { action: 'READ', resource: 'user' },
    { action: 'READ', resource: 'profile' }
  )
  async getUserProfile(@Param('id') id: string): Promise<User | null> {
    return this.userService.findById(this.decode(id));
  }
} 