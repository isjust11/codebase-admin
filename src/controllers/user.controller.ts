import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { UserService } from '../services/user.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { User } from '../entities/user.entity';
import { RegisterDto } from '../dtos/auth.dto';
import { UpdateUserDto } from '../dtos/user.dto';
import { PermissionGuard } from '../guards/permission.guard';
import { RequirePermissions } from 'src/decorators/require-permissions.decorator';
import { PaginationParams } from 'src/dtos/filter.dto';

@Controller('users')
@UseGuards(PermissionGuard)
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private userService: UserService) { }

  @Get()
  @RequirePermissions('ADMIN')
  async getNavigator(@Query('page') page: number, @Query('size') size: number, @Query('search') search: string) {
    const filter: PaginationParams = {
      page: page || 1,
      size: size || 10,
      search: search || ''
    };
    return this.userService.findAllWithPagination(filter);
  }
  
  @Get()
  @RequirePermissions('ADMIN')
  async findAll(): Promise<User[]> {
    return this.userService.findAll();
  }

  @Get(':id')
  @RequirePermissions('ADMIN')
  async findOne(@Param('id') id: string): Promise<User | null> {
    return this.userService.findById(parseInt(id));
  }

  @Post()
  @RequirePermissions('ADMIN')
  async create(@Body() createUserDto: RegisterDto): Promise<User> {
    return this.userService.create(createUserDto);
  }

  @Put(':id')
  @RequirePermissions('ADMIN')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.userService.update(parseInt(id), updateUserDto);
  }

  @Delete(':id')
  @RequirePermissions('ADMIN')
  async remove(@Param('id') id: string): Promise<void> {
    return this.userService.remove(parseInt(id));
  }

  @Put(':id/block')
  @RequirePermissions('ADMIN')
  async blockUser(@Param('id') id: string): Promise<User> {
    return this.userService.blockUser(parseInt(id));
  }

  @Put(':id/unblock')
  @RequirePermissions('ADMIN')
  async unblockUser(@Param('id') id: string): Promise<User> {
    return this.userService.unblockUser(parseInt(id));
  }
} 