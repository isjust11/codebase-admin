import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard, Public } from 'src/guards/jwt-auth.guard';
import { PermissionGuard } from 'src/guards/permission.guard';
import { InviteEffectService } from 'src/services/invite-effect.service';
import { BaseController } from '../base/base.controller';

@Controller('public/effects')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class PublicInviteEffectController extends BaseController {
  constructor(private readonly inviteEffectService: InviteEffectService) {
    super();
  }

  @Public()
  @Get()
  async list(@Res() res: Response) {
    try {
      const data = await this.inviteEffectService.findActive();
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }
}
