import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query, Res } from '@nestjs/common';
import { UserService } from '../../services/user.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RegisterDto } from '../../dtos/auth.dto';
import { UpdateUserDto } from '../../dtos/user.dto';
import { PermissionGuard } from '../../guards/permission.guard';
import { RequirePermission, RequirePermissionsAction } from 'src/decorators/require-permissions.decorator';
import { PaginationParams } from 'src/dtos/filter.dto';
import { BaseController } from '../base/base.controller';
import { Response } from 'express';
import { Locale } from 'src/decorators/locale.decorator';
import { SupportedLocale } from 'src/constants/messages';

@Controller('users')
@UseGuards(PermissionGuard)
@UseGuards(JwtAuthGuard)
export class UserController extends BaseController {
  constructor(private userService: UserService) {
    super();
  }

  @Get()
  @RequirePermission('READ', 'user')
  async getNavigator(@Query('page') page: number, @Query('size') size: number, @Query('search') search: string, @Res() res: Response) {
    const filter: PaginationParams = {
      page: page || 1,
      size: size || 10,
      search: search || ''
    };
    try {
      const result = await this.userService.findAllWithPagination(filter);
      return this.success(res, result);
    } catch (error) {
      this.error(res, error);
    }
  }
  
  @Get('all')
  @RequirePermission('READ', 'user')
  async findAll(@Res() res: Response) {
    try {
      const result = await this.userService.findAll();
      return this.success(res, result);
    } catch (error) {
      this.error(res, error);
    }
  }

  @Get(':id')
  @RequirePermission('READ', 'user')
  async findOne(@Param('id') id: string, @Res() res: Response) {
    try {
      const result = await this.userService.findById(this.decode(id));
      return this.success(res, result);
    } catch (error) {
      this.error(res, error);
    }
  }

  @Post()
  @RequirePermission('CREATE', 'user')
  async create(@Body() createUserDto: RegisterDto, @Res() res: Response) {
    try {
      const result = await this.userService.create(createUserDto);
      return this.success(res, result);
    } catch (error) {
      this.error(res, error);
    }
  }

  @Put(':id')
  @RequirePermission('UPDATE', 'user')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Locale() locale: SupportedLocale,
    @Res() res: Response,
  ) {
    try {
      const result = await this.userService.update(this.decode(id), updateUserDto, locale);
      return this.success(res, result);
    } catch (error) {
      this.error(res, error);
    }
  }

  @Delete(':id')
  @RequirePermission('DELETE', 'user')
  async remove(@Param('id') id: string, @Locale() locale: SupportedLocale, @Res() res: Response) {
    try {
      const result = await this.userService.remove(this.decode(id), locale);
      return this.success(res, result);
    } catch (error) {
      this.error(res, error);
    }
  }

  @Put(':id/block')
  @RequirePermission('UPDATE', 'user')
  async blockUser(@Param('id') id: string, @Locale() locale: SupportedLocale, @Res() res: Response) {
    try {
      const result = await this.userService.blockUser(this.decode(id), locale);
      return this.success(res, result);
    } catch (error) {
      this.error(res, error);
    }
  }

  @Put(':id/unblock')
  @RequirePermission('UPDATE', 'user')
  async unblockUser(@Param('id') id: string, @Locale() locale: SupportedLocale, @Res() res: Response) {
    try {
      const result = await this.userService.unblockUser(this.decode(id), locale);
      return this.success(res, result);
    } catch (error) {
      this.error(res, error);
    }
  }

  // Ví dụ sử dụng RequirePermissionsAction cho nhiều permission
  @Get(':id/profile')
  @RequirePermissionsAction(
    { action: 'READ', resource: 'user' },
    { action: 'READ', resource: 'profile' }
  )
  async getUserProfile(@Param('id') id: string, @Res() res: Response) {
    try {
      const result = await this.userService.findById(this.decode(id));
      return this.success(res, result);
    } catch (error) {
      this.error(res, error);
    }
  }
}