import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PermissionGuard } from '../../guards/permission.guard';
import { RequirePermission } from '../../decorators/require-permissions.decorator';
import { BaseController } from '../base/base.controller';
import { NotificationTemplateService } from '../../services/notification-template.service';

@Controller('notification-templates')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class NotificationTemplateController extends BaseController {
  constructor(private readonly service: NotificationTemplateService) { super(); }

  @Get()
  @RequirePermission('READ', 'notification_template')
  findByPage(@Query('page') page: number, @Query('size') size: number, @Query('search') search: string) {
    return this.service.findPagination(page || 1, size || 10, search || '');
  }

  @Post()
  @RequirePermission('CREATE', 'notification_template')
  create(@Body() body: any) { return this.service.create(body); }

  @Get(':id')
  @RequirePermission('READ', 'notification_template')
  findOne(@Param('id') id: string) { return this.service.findOne(this.decode(id)); }

  @Patch(':id')
  @RequirePermission('UPDATE', 'notification_template')
  update(@Param('id') id: string, @Body() body: any) { return this.service.update(this.decode(id), body); }

  @Delete(':id')
  @RequirePermission('DELETE', 'notification_template')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) { await this.service.remove(this.decode(id)); }
}



