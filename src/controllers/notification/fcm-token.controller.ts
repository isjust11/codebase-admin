import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PermissionGuard } from '../../guards/permission.guard';
import { RequirePermission } from '../../decorators/require-permissions.decorator';
import { BaseController } from '../base/base.controller';
import { FcmTokenService } from '../../services/fcm-token.service';

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
  register(@Body() body: any) { return this.service.registerOrUpdate(body); }

  @Patch(':id/deactivate')
  @RequirePermission('UPDATE', 'fcm_token')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deactivate(@Param('id') id: string) { await this.service.deactivate(this.decode(id)); }

  @Delete(':id')
  @RequirePermission('DELETE', 'fcm_token')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) { await this.service.remove(this.decode(id)); }
}



