import { Controller, Get, Param, UseGuards, Res, NotFoundException } from '@nestjs/common';
import { EventService } from '../../services/event.service';
import { BaseController } from '../base/base.controller';
import { JwtAuthGuard, Public } from '../../guards/jwt-auth.guard';
import { PermissionGuard } from '../../guards/permission.guard';
import { Response } from 'express';

/**
 * Public JSON API for React BaseTemplateHost (templates/wedding-invite).
 * Contract matches lib/events-store.ts EventInvitePayload.
 */
@Controller('public/events')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class PublicEventsController extends BaseController {
  constructor(private readonly eventService: EventService) {
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
}
