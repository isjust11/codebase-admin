import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, HttpCode, HttpStatus, Res, Req, Request, Put } from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RequirePermission } from '../../decorators/require-permissions.decorator';
import { BaseController } from '../base/base.controller';
import { NotificationRecordService } from '../../services/notification-record.service';
import { PaginationParams } from 'src/dtos/filter.dto';
import { Response } from 'express';
import { NotificationStatus } from 'src/enums/notification.enum';
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController extends BaseController {
  constructor(private readonly service: NotificationRecordService) {
    super();
  }

  @Get()
  @RequirePermission('READ', 'notification')
  async findByPage(@Query('page') page: number,
   @Query('size') size: number,
   @Query('search') search: string,
   @Query('isRead') isRead: string  ,
   @Request() req : any ,
   @Res() res: Response) {
    const filter: PaginationParams = {
      page: parseInt(page.toString()) || 1,
      size: parseInt(size.toString()) || 10,
      search: search || '',
      isRead: parseInt(isRead),
    };
    try {
      const userId = req.user.id;
      const data = await this.service.findPagination(filter, userId);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  // mark as readAll
  @Post('read-all')
  @RequirePermission('UPDATE', 'notification')
  async readAll(@Request() req : any , @Res() res: Response) {
    try {
      await this.service.readAll(req.user.id);
      return this.success(res, null);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Post('delete-all')
  @RequirePermission('DELETE', 'notification')
  async deleteAll(@Request() req : any , @Res() res: Response) {
    try {
      await this.service.deleteAll(req.user.id);
      return this.success(res, null);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get('unread-count')
  @RequirePermission('READ', 'notification')
  async unreadCount(@Request() req : any , @Res() res: Response) {
    try {
      const data = await this.service.unreadCount(req.user.id);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Put('mark-read/:id')
  @RequirePermission('UPDATE', 'notification')
  async markRead(@Param('id') id: string, @Res() res: Response) {
    try {
      const data = await this.service.update(this.decode(id), { status: NotificationStatus.READ });
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Post()
  @RequirePermission('CREATE', 'notification')
  async create(@Body() body: any, @Request() req : any , @Res() res: Response ) {
    try {
      const data = await this.service.create({
        ...body,
        userId: req.user.id,
      });
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get(':id')
  @RequirePermission('READ', 'notification')
  async findOne(@Param('id') id: string, @Res() res: Response) {
    try {
      const data = await this.service.findOne(this.decode(id));
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Patch(':id')
  @RequirePermission('UPDATE', 'notification')
  async update(@Param('id') id: string, @Body() body: any, @Res() res: Response) {
    try {
      const data = await this.service.update(this.decode(id), body);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Delete(':id')
  @RequirePermission('DELETE', 'notification')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Res() res: Response) {
    try {
      await this.service.remove(this.decode(id));
      return this.success(res, null);
    } catch (error) {
      return this.error(res, error);
    }
  }
}



