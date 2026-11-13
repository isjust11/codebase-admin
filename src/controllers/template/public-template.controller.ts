import { Controller, Get, Param, Query, UseGuards, Res } from '@nestjs/common';
import { TemplateService } from '../../services/template.service';
import { BaseController } from '../base/base.controller';
import { JwtAuthGuard, Public } from '../../guards/jwt-auth.guard';
import { PermissionGuard } from '../../guards/permission.guard';
import { Response } from 'express';
import { Locale } from '../../decorators/locale.decorator';
import { SupportedLocale } from '../../constants/messages';
import { TemplateType } from '../../enums/template-type.enum';

@Controller('public/templates')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class PublicTemplateController extends BaseController {
  constructor(private readonly templateService: TemplateService) {
    super();
  }

  @Public()
  @Get()
  async list(@Query('type') type: string, @Res() res: Response) {
    try {
      const valid = Object.values(TemplateType).includes(type as TemplateType) ? (type as TemplateType) : undefined;
      return res.status(200).json(await this.templateService.publicList(valid));
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Public()
  @Get('slug/:slug/demo')
  async demo(@Param('slug') slug: string, @Locale() locale: SupportedLocale, @Res() res: Response) {
    try {
      return res.status(200).json(await this.templateService.publicDemo(slug, locale));
    } catch (error) {
      return this.error(res, error);
    }
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
