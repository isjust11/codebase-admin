import { Controller, Get, Post, Body, Param, Delete, Query, UseGuards, Request, Res } from '@nestjs/common';
import { ContactService } from '../../services/contact.service';
import { ContactDto, ImportContactsDto } from '../../dtos/contact.dto';
import { PaginationParams } from '../../dtos/filter.dto';
import { BaseController } from '../base/base.controller';
import { PermissionGuard } from '../../guards/permission.guard';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { Response } from 'express';
import { Locale } from '../../decorators/locale.decorator';
import { SupportedLocale } from '../../constants/messages';

@Controller('contacts')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ContactController extends BaseController {
  constructor(private readonly contactService: ContactService) {
    super();
  }

  @Post()
  async create(@Body() dto: ContactDto, @Request() req, @Res() res: Response) {
    try {
      return this.success(res, await this.contactService.create(req.user.id, dto));
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
      const filter: PaginationParams = { page: page || 1, size: size || 20, search: search || '' };
      return this.success(res, await this.contactService.findPagination(req.user.id, filter));
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Post('import')
  async import(@Body() dto: ImportContactsDto, @Request() req, @Locale() locale: SupportedLocale, @Res() res: Response) {
    try {
      return this.success(res, await this.contactService.importMany(req.user.id, dto.contacts || [], locale));
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req, @Locale() locale: SupportedLocale, @Res() res: Response) {
    try {
      return this.success(res, await this.contactService.remove(this.decode(id), req.user.id, locale));
    } catch (error) {
      return this.error(res, error);
    }
  }
}
