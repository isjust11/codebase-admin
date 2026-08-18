import { Controller, Get, Post, Body, Param, UseGuards, Res } from '@nestjs/common';
import { GuestService } from '../../services/guest.service';
import { EventService } from '../../services/event.service';
import { TemplateRenderService } from '../../services/template-render.service';
import { RsvpDto } from '../../dtos/guest.dto';
import { BaseController } from '../base/base.controller';
import { JwtAuthGuard, Public } from '../../guards/jwt-auth.guard';
import { PermissionGuard } from '../../guards/permission.guard';
import { Response } from 'express';
import { Locale } from '../../decorators/locale.decorator';
import { SupportedLocale } from '../../constants/messages';

@Controller('public/e')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class PublicInviteController extends BaseController {
  constructor(
    private readonly guestService: GuestService,
    private readonly eventService: EventService,
    private readonly templateRenderService: TemplateRenderService,
  ) {
    super();
  }

  @Public()
  @Get(':token')
  async getInvite(@Param('token') token: string, @Locale() locale: SupportedLocale, @Res() res: Response) {
    try {
      const guest = await this.guestService.findByPublicToken(token, locale);
      const event = guest.event;
      const template = event?.template;
      const invitationUrl = this.eventService.invitationUrl(guest.publicToken);
      const html = template
        ? this.templateRenderService.mergeHtml(template.htmlContent, template.cssContent, {
            event: event as any,
            guest: guest as any,
            invitationUrl,
          })
        : '';
      return this.success(res, {
        html,
        invitationUrl,
        event: event
          ? {
              title: event.title,
              eventDate: event.eventDate,
              venue: event.venue,
              coverImageUrl: event.coverImageUrl,
              type: event.type,
            }
          : null,
        guest: {
          name: guest.name,
          rsvpStatus: guest.rsvpStatus,
          rsvpNote: guest.rsvpNote,
          plusOnes: guest.plusOnes,
        },
      });
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Public()
  @Post(':token/view')
  async markView(@Param('token') token: string, @Locale() locale: SupportedLocale, @Res() res: Response) {
    try {
      const guest = await this.guestService.markViewed(token, locale);
      return this.success(res, { viewedAt: guest.viewedAt });
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Public()
  @Post(':token/rsvp')
  async rsvp(@Param('token') token: string, @Body() dto: RsvpDto, @Locale() locale: SupportedLocale, @Res() res: Response) {
    try {
      const guest = await this.guestService.rsvp(token, dto.status, dto.note, dto.plusOnes, locale);
      return this.success(res, {
        rsvpStatus: guest.rsvpStatus,
        rsvpNote: guest.rsvpNote,
        plusOnes: guest.plusOnes,
        respondedAt: guest.respondedAt,
      });
    } catch (error) {
      return this.error(res, error);
    }
  }
}
