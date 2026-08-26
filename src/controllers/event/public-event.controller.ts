import { Controller, Get, Param, UseGuards, Res } from '@nestjs/common';
import { EventService } from '../../services/event.service';
import { BaseController } from '../base/base.controller';
import { JwtAuthGuard, Public } from '../../guards/jwt-auth.guard';
import { PermissionGuard } from '../../guards/permission.guard';
import { Response } from 'express';
import { Locale } from '../../decorators/locale.decorator';
import { SupportedLocale } from '../../constants/messages';

@Controller()
@UseGuards(JwtAuthGuard, PermissionGuard)
export class PublicEventController extends BaseController {
  constructor(private readonly eventService: EventService) {
    super();
  }

  @Public()
  @Get('public/events')
  async getPublicList(@Res() res: Response) {
    try {
      const data = await this.eventService.findPublicList();
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Public()
  @Get('api/events')
  async getApiPublicList(@Res() res: Response) {
    try {
      const data = await this.eventService.findPublicList();
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Public()
  @Get('public/events/:slug')
  async getPublicEventBySlug(
    @Param('slug') slug: string,
    @Locale() locale: SupportedLocale,
    @Res() res: Response,
  ) {
    try {
      const data = await this.eventService.findPublicBySlug(slug, locale);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Public()
  @Get('api/events/:slug')
  async getApiPublicEventBySlug(
    @Param('slug') slug: string,
    @Locale() locale: SupportedLocale,
    @Res() res: Response,
  ) {
    try {
      const data = await this.eventService.findPublicBySlug(slug, locale);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }
}
