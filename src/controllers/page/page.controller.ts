import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  Res,
} from '@nestjs/common';
import { PageService } from '../../services/page.service';
import { CreatePageDto } from '../../dtos/create-page.dto';
import { UpdatePageDto } from '../../dtos/update-page.dto';
import { BaseController } from '../base/base.controller';
import { RequirePermission } from '../../decorators/require-permissions.decorator';
import { PermissionGuard } from '../../guards/permission.guard';
import { JwtAuthGuard, Public } from '../../guards/jwt-auth.guard';
import { Response } from 'express';
import { Locale } from 'src/decorators/locale.decorator';
import { SupportedLocale } from 'src/constants/messages';

@Controller('pages')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class PageController extends BaseController {
  constructor(private readonly pageService: PageService) {
    super();
  }

  @Post()
  @RequirePermission('CREATE', 'static_page')
  async create(@Body() createPageDto: CreatePageDto, @Request() req, @Locale() locale: SupportedLocale, @Res() res: Response) {
    try {
      const data = await this.pageService.create({
        ...createPageDto,
        createdBy: req.user.id,
      }, locale);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get()
  @RequirePermission('READ', 'static_page')
  async getByPage(@Res() res: Response,
    @Query('page') page: number,
    @Query('size') size: number,
    @Query('search') search: string,
  ) {
    try {
      const data = await this.pageService.findPagination({ page, size, search });
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }
  @Public()
  @Get('slug/:slug')
  async findBySlug(@Res() res: Response, @Param('slug') slug: string, @Locale() locale: SupportedLocale) {
    try {
      const data = await this.pageService.findBySlug(slug, locale);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  // Serve static policy page (public)
  @Public()
  @Get('policy.html')
  async getPolicy(@Res() res: Response) {
    const path = require('path');
    const fs = require('fs');
    const filePath = path.join(__dirname, '..', '..', '..', '..', 'public', 'pages', 'policy.html');
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Policy file not found' });
    }
    return res.sendFile(filePath);
  }

  // Serve static support page (public)
  @Public()
  @Get('support.html')
  async getSupport(@Res() res: Response) {
    const path = require('path');
    const fs = require('fs');
    const filePath = path.join(__dirname, '..', '..', '..', '..', 'public', 'pages', 'support.html');
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Support file not found' });
    }
    return res.sendFile(filePath);
  }

  // Serve static terms of use page (public)
  @Public()
  @Get('terms.html')
  async getTerms(@Res() res: Response) {
    const path = require('path');
    const fs = require('fs');
    const filePath = path.join(__dirname, '..', '..', '..', '..', 'public', 'pages', 'terms.html');
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Terms file not found' });
    }
    return res.sendFile(filePath);
  }

  // Serve static terms of use page (public)
  @Public()
  @Get('index.html')
  async getIndex(@Res() res: Response) {
    const path = require('path');
    const fs = require('fs');
    const filePath = path.join(__dirname, '..', '..', '..', '..', 'public', 'pages', 'index.html');
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Index file not found' });
    }
    return res.sendFile(filePath);
  }

  @Get(':id')
  @RequirePermission('READ', 'static_page')
  async findOne(@Res() res: Response, @Param('id') id: string, @Locale() locale: SupportedLocale) {
    try {
      const data = await this.pageService.findOne(this.decode(id), locale);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }



  @Patch(':id')
  @RequirePermission('UPDATE', 'static_page')
  async update(
    @Param('id') id: string,
    @Res() res: Response,
    @Body() updatePageDto: UpdatePageDto,
    @Request() req,
    @Locale() locale: SupportedLocale,
  ) {
    try {
      const data = await this.pageService.update(this.decode(id), {
        ...updatePageDto,
        updatedBy: req.user.id,
      }, locale);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Patch(':id/toggle-active')
  @RequirePermission('UPDATE', 'static_page')
  async toggleActive(@Res() res: Response, @Param('id') id: string, @Locale() locale: SupportedLocale) {
    try {
      const data = await this.pageService.toggleActive(this.decode(id), locale);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Delete(':id')
  @RequirePermission('DELETE', 'static_page')
  async remove(@Res() res: Response, @Param('id') id: string, @Locale() locale: SupportedLocale) {
    try {
      const data = await this.pageService.remove(this.decode(id), locale);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }
}
