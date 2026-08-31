import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  UseGuards,
  Request,
  Res,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { EventService } from '../../services/event.service';
import { GuestService } from '../../services/guest.service';
import { InvitationRenderService } from '../../services/invitation-render.service';
import { WishService } from '../../services/wish.service';
import { EventDto, EventDataDto, AssignTemplateDto, UpdateCustomizationDto, UpsertEventMediaDto } from '../../dtos/event.dto';
import { GuestDto, ImportGuestsDto } from '../../dtos/guest.dto';
import { PaginationParams } from '../../dtos/filter.dto';
import { BaseController } from '../base/base.controller';
import { PermissionGuard } from '../../guards/permission.guard';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RequirePermission } from '../../decorators/require-permissions.decorator';
import { ACTIONS, RESOURCES } from '../../constants/permission.constants';
import { Response } from 'express';
import { Locale } from '../../decorators/locale.decorator';
import { SupportedLocale } from '../../constants/messages';
import { GuestSource } from '../../enums/guest-source.enum';
import { WishStatus } from '../../enums/wish-status.enum';
import { parseGuestImportFile } from '../../utils/guest-import.util';

@Controller('events')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class EventController extends BaseController {
  constructor(
    private readonly eventService: EventService,
    private readonly guestService: GuestService,
    private readonly invitationRenderService: InvitationRenderService,
    private readonly wishService: WishService,
  ) {
    super();
  }

  @Post()
  async create(@Body() dto: EventDto, @Request() req, @Res() res: Response) {
    try {
      if (dto.templateId !== undefined && dto.templateId !== null && dto.templateId !== '') {
        dto.templateId = this.decode(String(dto.templateId));
      } else {
        dto.templateId = undefined;
      }
      return this.success(res, await this.eventService.create(req.user.id, dto));
    } catch (error) {
      return this.error(res, error);
    }
  }

  /** Seed React templates (wedding-basic, wedding-invite2) + demo events. */
  @Post('demo/seed-wedding')
  async seedWeddingDemo(@Request() req, @Res() res: Response) {
    try {
      return this.success(res, await this.eventService.seedWeddingDemo(req.user.id));
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get()
  async getByPage(
    @Query('page') page: number,
    @Query('size') size: number,
    @Query('search') search: string,
    @Request() req,
    @Res() res: Response,
  ) {
    try {
      const filter: PaginationParams = { page: page || 1, size: size || 10, search: search || '' };
      return this.success(res, await this.eventService.findPagination(req.user.id, filter));
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get(':id/preview')
  async preview(
    @Param('id') id: string,
    @Query('guestId') guestId: string,
    @Request() req,
    @Locale() locale: SupportedLocale,
    @Res() res: Response,
  ) {
    try {
      const decodedGuest = guestId ? this.decode(guestId) : undefined;
      return this.success(res, await this.eventService.preview(this.decode(id), req.user.id, decodedGuest, locale));
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get(':id/rsvp-stats')
  async rsvpStats(@Param('id') id: string, @Request() req, @Locale() locale: SupportedLocale, @Res() res: Response) {
    try {
      return this.success(res, await this.eventService.rsvpStats(this.decode(id), req.user.id, locale));
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get(':id/guests')
  async listGuests(
    @Param('id') id: string,
    @Query('page') page: number,
    @Query('size') size: number,
    @Query('search') search: string,
    @Request() req,
    @Locale() locale: SupportedLocale,
    @Res() res: Response,
  ) {
    try {
      const filter: PaginationParams = { page: page || 1, size: size || 20, search: search || '' };
      return this.success(res, await this.guestService.findPagination(this.decode(id), req.user.id, filter, locale));
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Post(':id/guests/import')
  async importGuests(
    @Param('id') id: string,
    @Body() dto: ImportGuestsDto,
    @Request() req,
    @Locale() locale: SupportedLocale,
    @Res() res: Response,
  ) {
    try {
      return this.success(
        res,
        await this.guestService.importMany(this.decode(id), req.user.id, dto.guests || [], GuestSource.CONTACT, locale),
      );
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Post(':id/guests/import-file')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }))
  async importFile(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('columnMapping') columnMapping: string,
    @Request() req,
    @Locale() locale: SupportedLocale,
    @Res() res: Response,
  ) {
    try {
      const mapping = columnMapping ? JSON.parse(columnMapping) : {};
      const guests = parseGuestImportFile(file, mapping);
      return this.success(
        res,
        await this.guestService.importMany(this.decode(id), req.user.id, guests, GuestSource.FILE, locale),
      );
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Post(':id/guests')
  async createGuest(
    @Param('id') id: string,
    @Body() dto: GuestDto,
    @Request() req,
    @Locale() locale: SupportedLocale,
    @Res() res: Response,
  ) {
    try {
      return this.success(res, await this.guestService.create(this.decode(id), req.user.id, dto, locale));
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Put(':id/guests/:guestId')
  async updateGuest(
    @Param('id') id: string,
    @Param('guestId') guestId: string,
    @Body() dto: GuestDto,
    @Request() req,
    @Locale() locale: SupportedLocale,
    @Res() res: Response,
  ) {
    try {
      return this.success(
        res,
        await this.guestService.update(this.decode(id), this.decode(guestId), req.user.id, dto, locale),
      );
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Delete(':id/guests/:guestId')
  async deleteGuest(
    @Param('id') id: string,
    @Param('guestId') guestId: string,
    @Request() req,
    @Locale() locale: SupportedLocale,
    @Res() res: Response,
  ) {
    try {
      return this.success(res, await this.guestService.remove(this.decode(id), this.decode(guestId), req.user.id, locale));
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Post(':id/guests/:guestId/render-image')
  async renderImage(
    @Param('id') id: string,
    @Param('guestId') guestId: string,
    @Request() req,
    @Locale() locale: SupportedLocale,
    @Res() res: Response,
  ) {
    try {
      return this.success(
        res,
        await this.invitationRenderService.renderGuestImage(this.decode(id), this.decode(guestId), req.user.id, locale),
      );
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get(':id/wishes')
  async listWishes(
    @Param('id') id: string,
    @Request() req,
    @Locale() locale: SupportedLocale,
    @Res() res: Response,
  ) {
    try {
      return this.success(res, await this.wishService.listForHost(this.decode(id), req.user.id, locale));
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Post(':id/wishes/:wishId/approve')
  async approveWish(
    @Param('id') id: string,
    @Param('wishId') wishId: string,
    @Request() req,
    @Locale() locale: SupportedLocale,
    @Res() res: Response,
  ) {
    try {
      return this.success(
        res,
        await this.wishService.moderate(this.decode(id), this.decode(wishId), req.user.id, WishStatus.APPROVED, locale),
      );
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Post(':id/wishes/:wishId/reject')
  async rejectWish(
    @Param('id') id: string,
    @Param('wishId') wishId: string,
    @Request() req,
    @Locale() locale: SupportedLocale,
    @Res() res: Response,
  ) {
    try {
      return this.success(
        res,
        await this.wishService.moderate(this.decode(id), this.decode(wishId), req.user.id, WishStatus.REJECTED, locale),
      );
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Delete(':id/wishes/:wishId')
  async deleteWish(
    @Param('id') id: string,
    @Param('wishId') wishId: string,
    @Request() req,
    @Locale() locale: SupportedLocale,
    @Res() res: Response,
  ) {
    try {
      return this.success(res, await this.wishService.remove(this.decode(id), this.decode(wishId), req.user.id, locale));
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req, @Locale() locale: SupportedLocale, @Res() res: Response) {
    try {
      return this.success(res, await this.eventService.findOneForUser(this.decode(id), req.user.id, locale));
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get(':id/customization')
  @RequirePermission(ACTIONS.READ, RESOURCES.EVENT)
  async getCustomization(@Param('id') id: string, @Request() req, @Locale() locale: SupportedLocale, @Res() res: Response) {
    try {
      return this.success(res, await this.eventService.getCustomization(this.decode(id), req.user.id, locale, req.user));
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Put(':id/customization')
  @RequirePermission(ACTIONS.UPDATE, RESOURCES.EVENT)
  async updateCustomization(
    @Param('id') id: string,
    @Body() dto: UpdateCustomizationDto,
    @Request() req,
    @Locale() locale: SupportedLocale,
    @Res() res: Response,
  ) {
    try {
      return this.success(res, await this.eventService.updateCustomization(this.decode(id), req.user.id, dto, locale, req.user));
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Put(':id/data')
  @RequirePermission(ACTIONS.UPDATE, RESOURCES.EVENT)
  async updateData(
    @Param('id') id: string,
    @Body() dto: EventDataDto,
    @Request() req,
    @Locale() locale: SupportedLocale,
    @Res() res: Response,
  ) {
    try {
      return this.success(res, await this.eventService.updateData(this.decode(id), req.user.id, dto.eventData || {}, locale));
    } catch (error) {
      return this.error(res, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Event Media Endpoints (Hybrid Storage)
  // ---------------------------------------------------------------------------

  @Get(':id/media')
  @RequirePermission(ACTIONS.READ, RESOURCES.EVENT)
  async getMedia(
    @Param('id') id: string,
    @Query('groupKey') groupKey: string,
    @Request() req,
    @Locale() locale: SupportedLocale,
    @Res() res: Response,
  ) {
    try {
      return this.success(res, await this.eventService.getMedia(this.decode(id), req.user.id, locale, groupKey));
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Put(':id/media')
  @RequirePermission(ACTIONS.UPDATE, RESOURCES.EVENT)
  async upsertMedia(
    @Param('id') id: string,
    @Body() dto: UpsertEventMediaDto,
    @Request() req,
    @Locale() locale: SupportedLocale,
    @Res() res: Response,
  ) {
    try {
      return this.success(res, await this.eventService.upsertMedia(this.decode(id), req.user.id, dto, locale, req.user));
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Delete(':id/media/:mediaId')
  @RequirePermission(ACTIONS.UPDATE, RESOURCES.EVENT)
  async deleteMediaItem(
    @Param('id') id: string,
    @Param('mediaId') mediaId: string,
    @Request() req,
    @Locale() locale: SupportedLocale,
    @Res() res: Response,
  ) {
    try {
      return this.success(res, await this.eventService.deleteMediaItem(this.decode(mediaId), this.decode(id), req.user.id, locale, req.user));
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Put(':id/template')
  async assignTemplate(
    @Param('id') id: string,
    @Body() dto: AssignTemplateDto,
    @Request() req,
    @Locale() locale: SupportedLocale,
    @Res() res: Response,
  ) {
    try {
      return this.success(
        res,
        await this.eventService.assignTemplate(this.decode(id), req.user.id, this.decode(String(dto.templateId)), locale),
      );
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Post(':id/publish')
  async publish(@Param('id') id: string, @Request() req, @Locale() locale: SupportedLocale, @Res() res: Response) {
    try {
      return this.success(res, await this.eventService.publish(this.decode(id), req.user.id, locale));
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: EventDto,
    @Request() req,
    @Locale() locale: SupportedLocale,
    @Res() res: Response,
  ) {
    try {
      return this.success(res, await this.eventService.update(this.decode(id), req.user.id, dto, locale));
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req, @Locale() locale: SupportedLocale, @Res() res: Response) {
    try {
      return this.success(res, await this.eventService.remove(this.decode(id), req.user.id, locale));
    } catch (error) {
      return this.error(res, error);
    }
  }
}
