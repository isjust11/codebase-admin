import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, HttpCode, HttpStatus, Req, Res } from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PermissionGuard } from '../../guards/permission.guard';
import { RequirePermission } from '../../decorators/require-permissions.decorator';
import { BaseController } from '../base/base.controller';
import { NotificationConfigService } from '../../services/notification-config.service';
import { Response } from 'express';
import { Locale } from 'src/decorators/locale.decorator';
import { SupportedLocale } from 'src/constants/messages';

@Controller('notification-configs')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class NotificationConfigController extends BaseController {
  constructor(private readonly service: NotificationConfigService) { super(); }

  @Get()
  @RequirePermission('READ', 'notification_config')
  async findByPage(
    @Res() res: Response,
    @Query('page') page: number, 
    @Query('size') size: number, 
    @Query('search') search: string,
    @Query('userId') userId?: number,
  ) {
    try {
      const data = await this.service.findPagination(page || 1, size || 10, search || '', userId);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get('by-key/:key')
  @RequirePermission('READ', 'notification_config')
  async getByKey(
    @Res() res: Response,
    @Param('key') key: string,
    @Query('userId') userId?: number,
  ) {
    try {
      const data = await this.service.findByKeyAndUser(key, userId);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get('value/:key')
  @RequirePermission('READ', 'notification_config')
  async getConfigValue(
    @Res() res: Response,
    @Param('key') key: string,
    @Query('userId') userId?: number,
    @Query('default') defaultValue?: any
  ) {
    try {
      const data = await this.service.getConfigValue(key, userId, defaultValue);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get('my-configs')
  @RequirePermission('READ', 'notification_config')
  async getMyConfigs(
    @Req() req,
    @Res() res: Response,
    @Query('page') page: number,
    @Query('size') size: number,
    @Query('search') search: string
  ) {
    const userId = req.user?.id;
    try {
      const data = await this.service.findPagination(page || 1, size || 10, search || '', userId);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Post()
  @RequirePermission('CREATE', 'notification_config')
  async create(@Body() body: any, @Res() res: Response) {
    try {
      const data = await this.service.create(body);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get(':id')
  @RequirePermission('READ', 'notification_config')
  async findOne(@Param('id') id: string, @Res() res: Response) {
    try {
      const data = await this.service.findOne(this.decode(id));
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Patch(':id')
  @RequirePermission('UPDATE', 'notification_config')
  async update(@Param('id') id: string, @Body() body: any, @Locale() locale: SupportedLocale, @Res() res: Response) {
    try {
      const data = await this.service.update(this.decode(id), body, locale);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Delete(':id')
  @RequirePermission('DELETE', 'notification_config')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Locale() locale: SupportedLocale, @Res() res: Response) {
    try {
      await this.service.remove(this.decode(id), locale);
      return this.success(res, null);
    } catch (error) {
      return this.error(res, error);
    }
  }
}
