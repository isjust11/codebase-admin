import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PermissionGuard } from '../../guards/permission.guard';
import { RequirePermission } from '../../decorators/require-permissions.decorator';
import { BaseController } from '../base/base.controller';
import { NotificationConfigService } from '../../services/notification-config.service';

@Controller('notification-configs')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class NotificationConfigController extends BaseController {
  constructor(private readonly service: NotificationConfigService) { super(); }

  @Get()
  @RequirePermission('READ', 'notification_config')
  findByPage(@Query('page') page: number, @Query('size') size: number, @Query('search') search: string) {
    return this.service.findPagination(page || 1, size || 10, search || '');
  }

  @Post()
  @RequirePermission('CREATE', 'notification_config')
  create(@Body() body: any) { return this.service.create(body); }

  @Get(':id')
  @RequirePermission('READ', 'notification_config')
  findOne(@Param('id') id: string) { return this.service.findOne(this.decode(id)); }

  @Patch(':id')
  @RequirePermission('UPDATE', 'notification_config')
  update(@Param('id') id: string, @Body() body: any) { return this.service.update(this.decode(id), body); }

  @Delete(':id')
  @RequirePermission('DELETE', 'notification_config')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) { await this.service.remove(this.decode(id)); }
}



