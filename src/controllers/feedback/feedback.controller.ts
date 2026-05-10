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
import { FeedbackService } from '../../services/feedback.service';
import { CreateFeedbackDto } from '../../dtos/create-feedback.dto';
import { UpdateFeedbackDto } from '../../dtos/update-feedback.dto';
import { BaseController } from '../base/base.controller';
import { RequirePermission } from '../../decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { Response } from 'express';
import { FeedbackStatus } from '../../entities/feedback.entity';
import { Locale } from 'src/decorators/locale.decorator';
import { SupportedLocale } from 'src/constants/messages';

@Controller('feedback')
@UseGuards(JwtAuthGuard)
export class FeedbackController extends BaseController {
  constructor(private readonly feedbackService: FeedbackService) {
    super();
  }

  @Post()
  @RequirePermission('CREATE', 'feedback')
  async create(@Body() createFeedbackDto: CreateFeedbackDto, @Request() req, @Res() res: Response) {
    try {
      const data = await this.feedbackService.create({
        ...createFeedbackDto,
        userId: req.user?.id,
      });
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Post('public')
  async createPublic(@Body() createFeedbackDto: CreateFeedbackDto, @Res() res: Response) {
    try {
      const data = await this.feedbackService.create(createFeedbackDto);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get()
  @RequirePermission('READ', 'feedback')
  async getByPage(
    @Res() res: Response,
    @Query('page') page: number,
    @Query('size') size: number,
    @Query('search') search: string,
    @Query('status') status: FeedbackStatus,
    @Query('type') type: string,
    @Query('priority') priority: string,
    @Query('assignedToId') assignedToId: number,
    @Query('userId') userId: number,
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
  ) {
    try {
      const data = await this.feedbackService.findPagination({ 
        page, 
        size, 
        search, 
        status,
        type: type as any,
        priority: priority as any,
        assignedToId,
        userId,
        dateFrom,
        dateTo
      });
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get('public')
  async getPublic(@Res() res: Response) {
    try {
      const data = await this.feedbackService.findPublic();
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get('stats')
  @RequirePermission('READ', 'feedback')
  async getStats(@Res() res: Response) {
    try {
      const data = await this.feedbackService.getStats();
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get('recent')
  @RequirePermission('READ', 'feedback')
  async getRecent(
    @Res() res: Response,
    @Query('limit') limit: number = 10,
  ) {
    try {
      const data = await this.feedbackService.getRecentFeedback(limit);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get(':id')
  @RequirePermission('READ', 'feedback')
  async findOne(@Res() res: Response, @Param('id') id: string, @Locale() locale: SupportedLocale) {
    try {
      const data = await this.feedbackService.findOne(this.decode(id), locale);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Patch(':id')
  @RequirePermission('UPDATE', 'feedback')
  async update(
    @Param('id') id: string,
    @Res() res: Response,
    @Body() updateFeedbackDto: UpdateFeedbackDto,
    @Locale() locale: SupportedLocale,
    @Request() req,
  ) {
    try {
      const data = await this.feedbackService.update(this.decode(id), {
        ...updateFeedbackDto,
      }, locale);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Patch(':id/status')
  @RequirePermission('UPDATE', 'feedback')
  async updateStatus(
    @Param('id') id: string,
    @Res() res: Response,
    @Body('status') status: FeedbackStatus,
    @Locale() locale: SupportedLocale,
  ) {
    try {
      const data = await this.feedbackService.updateStatus(this.decode(id), status, locale);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Patch(':id/assign')
  @RequirePermission('UPDATE', 'feedback')
  async assignToUser(
    @Param('id') id: string,
    @Res() res: Response,
    @Body('assignedToId') assignedToId: number,
    @Locale() locale: SupportedLocale,
  ) {
    try {
      const data = await this.feedbackService.assignToUser(this.decode(id), assignedToId, locale);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Delete(':id')
  @RequirePermission('DELETE', 'feedback')
  async remove(@Res() res: Response, @Param('id') id: string, @Locale() locale: SupportedLocale) {
    try {
      await this.feedbackService.remove(this.decode(id), locale);
      return this.success(res, { message: 'Feedback deleted successfully' });
    } catch (error) {
      return this.error(res, error);
    }
  }
}
