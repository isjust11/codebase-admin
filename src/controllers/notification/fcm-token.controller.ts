import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, HttpCode, HttpStatus, Res, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PermissionGuard } from '../../guards/permission.guard';
import { RequirePermission } from '../../decorators/require-permissions.decorator';
import { BaseController } from '../base/base.controller';
import { FcmTokenService } from '../../services/fcm-token.service';
import { Response } from 'express';
import { FcmTokenDto } from '../../dtos/fcm-token.dto';
@Controller('fcm-tokens')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class FcmTokenController extends BaseController {
  constructor(private readonly service: FcmTokenService) { super(); }

  @Get()
  @RequirePermission('READ', 'fcm_token')
  findByPage(@Query('page') page: number, @Query('size') size: number, @Query('search') search: string) {
    return this.service.findPagination(page || 1, size || 10, search || '');
  }

  @Post('register')
  @RequirePermission('CREATE', 'fcm_token')
  async register(@Body() body: FcmTokenDto,@Res() res: Response, @Req() req) { 
    try {
      const userId = req.user?.id;
      const result = await this.service.registerOrUpdate({
        token: body.token,
        platform: body.platform,
        deviceId: body.deviceId,
      }, userId);
      return this.success(res, result);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Post('batch-register')
  @RequirePermission('CREATE', 'fcm_token')
  async batchRegister(@Body() body: FcmTokenDto[], @Res() res: Response, @Req() req) {
    try {
      const userId = req.user?.id;
      const result = await this.service.registerMany(body, userId);
      return this.success(res, result);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get('user/:userId')
  @RequirePermission('READ', 'fcm_token')
  async findByUser(@Param('userId') userId: string, @Res() res: Response) {
    try {
      const result = await this.service.findByUserId(this.decode(userId));
      return this.success(res, result);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get(':id')
  @RequirePermission('READ', 'fcm_token')
  async findOne(@Param('id') id: string, @Res() res: Response) {
    try {
      const result = await this.service.findById(this.decode(id));
      return this.success(res, result);
    } catch (error) {
      return this.error(res, error);
    }
  }
  @Post('subscribe-topic')
  @RequirePermission('CREATE', 'fcm_token')
  async subscribeTopic(@Body() body: { topic: string }, @Res() res: Response) {
    try {
      const result = await this.service.subscribeTopic(body.topic);
      return this.success(res, result);
    } catch (error) {
      return this.error(res, error);
    }
  }
  @Post('unsubscribe-topic')
  @RequirePermission('CREATE', 'fcm_token')
  async unsubscribeTopic(@Body() body: { topic: string }, @Res() res: Response) {
    try {
      const result = await this.service.unsubscribeTopic(body.topic);
      return this.success(res, result);
    } catch (error) {
      return this.error(res, error);
    }
  }
  @Patch(':id/deactivate')
  @RequirePermission('UPDATE', 'fcm_token')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deactivate(@Param('id') id: string) { await this.service.deactivate(this.decode(id)); }

  @Delete(':id')
  @RequirePermission('DELETE', 'fcm_token')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) { await this.service.remove(this.decode(id)); }
}



