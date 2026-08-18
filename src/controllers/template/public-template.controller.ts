import { Controller, Get, Param, UseGuards, Res } from '@nestjs/common';
import { TemplateService } from '../../services/template.service';
import { BaseController } from '../base/base.controller';
import { JwtAuthGuard, Public } from '../../guards/jwt-auth.guard';
import { PermissionGuard } from '../../guards/permission.guard';
import { Response } from 'express';
import { Locale } from '../../decorators/locale.decorator';
import { SupportedLocale } from '../../constants/messages';

@Controller('public/templates')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class PublicTemplateController extends BaseController {
  constructor(private readonly templateService: TemplateService) {
    super();
  }

  @Public()
  @Get(':id/preview')
  async preview(@Param('id') id: string, @Locale() locale: SupportedLocale, @Res() res: Response) {
    try {
      const data = await this.templateService.publicPreview(this.decode(id), locale);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }
}
