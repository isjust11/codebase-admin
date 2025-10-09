import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Res,
} from '@nestjs/common';
import { FeedbackService } from '../../services/feedback.service';
import { CreateFeedbackDto } from '../../dtos/create-feedback.dto';
import { BaseController } from '../base/base.controller';
import { Response } from 'express';

@Controller('public/feedback')
export class PublicFeedbackController extends BaseController {
  constructor(private readonly feedbackService: FeedbackService) {
    super();
  }

  @Post()
  async create(@Body() createFeedbackDto: CreateFeedbackDto, @Res() res: Response) {
    try {
      const data = await this.feedbackService.create(createFeedbackDto);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get()
  async getPublic(@Res() res: Response) {
    try {
      const data = await this.feedbackService.findPublic();
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get(':id')
  async findOne(@Res() res: Response, @Param('id') id: string) {
    try {
      const data = await this.feedbackService.findOne(this.decode(id));
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }
}
