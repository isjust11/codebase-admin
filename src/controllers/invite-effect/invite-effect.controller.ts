import { Body, Controller, Delete, Get, Param, Post, Put, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { RequirePermission } from 'src/decorators/require-permissions.decorator';
import { InviteEffectDto } from 'src/dtos/invite-effect.dto';
import { PaginationParams } from 'src/dtos/filter.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { PermissionGuard } from 'src/guards/permission.guard';
import { InviteEffectService } from 'src/services/invite-effect.service';
import { BaseController } from '../base/base.controller';

@Controller('invite-effects')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class InviteEffectController extends BaseController {
  constructor(private readonly inviteEffectService: InviteEffectService) {
    super();
  }

  @Get()
  @RequirePermission('READ', 'invite-effect')
  async getByPagination(
    @Query('page') page: number,
    @Query('size') size: number,
    @Query('search') search: string,
    @Res() res: Response,
  ) {
    const filter: PaginationParams = { page: page || 1, size: size || 10, search: search || '' };
    try {
      const data = await this.inviteEffectService.findAllWithPagination(filter);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get('active')
  @RequirePermission('READ', 'invite-effect')
  async getActive(@Res() res: Response) {
    try {
      const data = await this.inviteEffectService.findActive();
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get(':id')
  @RequirePermission('READ', 'invite-effect')
  async findOne(@Param('id') id: string, @Res() res: Response) {
    try {
      const data = await this.inviteEffectService.findOne(this.decode(id));
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Post()
  @RequirePermission('CREATE', 'invite-effect')
  async create(@Body() dto: InviteEffectDto, @Res() res: Response) {
    try {
      const data = await this.inviteEffectService.create(dto);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Put(':id')
  @RequirePermission('UPDATE', 'invite-effect')
  async update(@Param('id') id: string, @Body() dto: InviteEffectDto, @Res() res: Response) {
    try {
      const data = await this.inviteEffectService.update(this.decode(id), dto);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Delete(':id')
  @RequirePermission('DELETE', 'invite-effect')
  async remove(@Param('id') id: string, @Res() res: Response) {
    try {
      const data = await this.inviteEffectService.remove(this.decode(id));
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }
}
