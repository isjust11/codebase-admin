import { Controller, Get, Post, Body, Param, UseGuards, Res, NotFoundException } from '@nestjs/common';
import { EventService } from '../../services/event.service';
import { GuestService } from '../../services/guest.service';
import { PublicEventRsvpDto } from '../../dtos/guest.dto';
import { BaseController } from '../base/base.controller';
import { JwtAuthGuard, Public } from '../../guards/jwt-auth.guard';
import { PermissionGuard } from '../../guards/permission.guard';
import { Response } from 'express';
import { Locale } from '../../decorators/locale.decorator';
import { SupportedLocale } from '../../constants/messages';

/**
 * Public JSON API for React BaseTemplateHost (templates/wedding-invite).
 * Contract matches lib/events-store.ts EventInvitePayload.
 */
@Controller('public/events')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class PublicEventsController extends BaseController {
  constructor(
    private readonly eventService: EventService,
    private readonly guestService: GuestService,
  ) {
    super();
  }

  @Public()
  @Get()
  async list(@Res() res: Response) {
    try {
      const events = await this.eventService.listPublicPublished();
      // Return raw shape expected by wedding-invite demo (no id encryption)
      return res.status(200).json({ events });
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Public()
  @Get(':slug')
  async getBySlug(@Param('slug') slug: string, @Res() res: Response) {
    try {
      const payload = await this.eventService.findPublicBySlug(slug);
      return res.status(200).json(payload);
    } catch (error) {
      if (error instanceof NotFoundException) {
        const body = error.getResponse();
        const payload =
          typeof body === 'object' && body !== null
            ? body
            : { message: error.message, available: [] };
        return res.status(404).json(payload);
      }
      return this.error(res, error);
    }
  }

  @Public()
  @Post(':slug/rsvp')
  async rsvpBySlug(
    @Param('slug') slug: string,
    @Body() dto: PublicEventRsvpDto,
    @Locale() locale: SupportedLocale,
    @Res() res: Response,
  ) {
    try {
      const guest = await this.guestService.rsvpByEventSlug(slug, dto, locale);
      return res.status(200).json({
        ok: true,
        rsvpStatus: guest.rsvpStatus,
        plusOnes: guest.plusOnes,
        respondedAt: guest.respondedAt,
      });
    } catch (error) {
      return this.error(res, error);
    }
  }
}
