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
} from '@nestjs/common';
import { TemplateService } from '../../services/template.service';
import { TemplateDto, TemplatePreviewDto, TemplateRejectDto } from '../../dtos/template.dto';
import { PaginationParams } from '../../dtos/filter.dto';
import { BaseController } from '../base/base.controller';
import { RequirePermission } from '../../decorators/require-permissions.decorator';
import { PermissionGuard } from '../../guards/permission.guard';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { Response } from 'express';
import { Locale } from '../../decorators/locale.decorator';
import { SupportedLocale } from '../../constants/messages';
import { TemplateType } from '../../enums/template-type.enum';

@Controller('templates')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class TemplateController extends BaseController {
  constructor(private readonly templateService: TemplateService) {
    super();
  }

  @Get('catalog')
  async catalog(
    @Query('page') page: number,
    @Query('size') size: number,
    @Query('search') search: string,
    @Query('type') type: TemplateType,
    @Res() res: Response,
  ) {
    try {
      const filter: PaginationParams = { page: page || 1, size: size || 20, search: search || '' };
      const data = await this.templateService.findCatalog(filter, type);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get('mine')
  @RequirePermission('READ', 'template')
  async mine(
    @Query('page') page: number,
    @Query('size') size: number,
    @Query('search') search: string,
    @Request() req,
    @Res() res: Response,
  ) {
    try {
      const filter: PaginationParams = { page: page || 1, size: size || 10, search: search || '' };
      const data = await this.templateService.findMine(filter, req.user.id);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get('starters')
  @RequirePermission('READ', 'template')
  async starters(@Res() res: Response) {
    try {
      return this.success(res, this.templateService.catalogMeta());
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Post('preview-draft')
  @RequirePermission('READ', 'template')
  async previewDraft(@Body() dto: TemplatePreviewDto, @Res() res: Response) {
    try {
      const data = await this.templateService.previewDraft(dto);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Post()
  @RequirePermission('CREATE', 'template')
  async create(@Body() dto: TemplateDto, @Request() req, @Res() res: Response) {
    try {
      const data = await this.templateService.create({ ...dto, createdBy: req.user.id }, req.user);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get()
  @RequirePermission('READ', 'template')
  async getByPage(
    @Query('page') page: number,
    @Query('size') size: number,
    @Query('search') search: string,
    @Query('status') status: string,
    @Request() req,
    @Res() res: Response,
  ) {
    try {
      const filter: PaginationParams & { status?: string } = {
        page: page || 1,
        size: size || 10,
        search: search || '',
        status,
      };
      const data = await this.templateService.findPagination(filter, req.user);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Post(':id/preview')
  @RequirePermission('READ', 'template')
  async preview(
    @Param('id') id: string,
    @Body() dto: TemplatePreviewDto,
    @Locale() locale: SupportedLocale,
    @Res() res: Response,
  ) {
    try {
      const data = await this.templateService.preview(this.decode(id), dto?.sampleData || {}, locale);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Post(':id/submit')
  @RequirePermission('UPDATE', 'template')
  async submit(
    @Param('id') id: string,
    @Request() req,
    @Locale() locale: SupportedLocale,
    @Res() res: Response,
  ) {
    try {
      const data = await this.templateService.submit(this.decode(id), req.user, locale);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Post(':id/approve')
  @RequirePermission('APPROVE', 'template')
  async approve(@Param('id') id: string, @Locale() locale: SupportedLocale, @Res() res: Response) {
    try {
      const data = await this.templateService.approve(this.decode(id), locale);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Post(':id/reject')
  @RequirePermission('REJECT', 'template')
  async reject(
    @Param('id') id: string,
    @Body() dto: TemplateRejectDto,
    @Locale() locale: SupportedLocale,
    @Res() res: Response,
  ) {
    try {
      const data = await this.templateService.reject(this.decode(id), dto?.note, locale);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Post(':id/publish')
  @RequirePermission('PUBLISH', 'template')
  async publish(
    @Param('id') id: string,
    @Body() body: { isPublished?: boolean },
    @Locale() locale: SupportedLocale,
    @Res() res: Response,
  ) {
    try {
      const data = await this.templateService.publish(this.decode(id), body?.isPublished !== false, locale);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get(':id')
  @RequirePermission('READ', 'template')
  async findOne(@Param('id') id: string, @Locale() locale: SupportedLocale, @Res() res: Response) {
    try {
      return this.success(res, await this.templateService.findOne(this.decode(id), locale));
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Put(':id')
  @RequirePermission('UPDATE', 'template')
  async update(
    @Param('id') id: string,
    @Body() dto: TemplateDto,
    @Request() req,
    @Locale() locale: SupportedLocale,
    @Res() res: Response,
  ) {
    try {
      const data = await this.templateService.update(this.decode(id), dto, req.user, locale);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Delete(':id')
  @RequirePermission('DELETE', 'template')
  async remove(
    @Param('id') id: string,
    @Request() req,
    @Locale() locale: SupportedLocale,
    @Res() res: Response,
  ) {
    try {
      return this.success(res, await this.templateService.remove(this.decode(id), req.user, locale));
    } catch (error) {
      return this.error(res, error);
    }
  }
}
