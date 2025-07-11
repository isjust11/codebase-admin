import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { ExamQuestionService } from '../services/exam-question.service';
import { ExamQuestionDto } from '../dtos/exam-question.dto';
import { BaseController } from './base.controller';
import { RequirePermission } from 'src/decorators/require-permissions.decorator';
import { PermissionGuard } from 'src/guards/permission.guard';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

@Controller('exam-question')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ExamQuestionController extends BaseController{
  constructor(private readonly examQuestionService: ExamQuestionService) {
    super();
  }

  @Post()
  @RequirePermission('CREATE', 'exam-question')
  create(@Body() dto: ExamQuestionDto) {
    return this.examQuestionService.create(dto);
  }

  @Get()
  @RequirePermission('READ', 'exam-question')
  findAll() {
    return this.examQuestionService.findAll();
  }

  @Get(':id')
  @RequirePermission('READ', 'exam-question')
  findOne(@Param('id') id: string) {
    return this.examQuestionService.findOne(this.decode(id));
  }

  @Put(':id')
  @RequirePermission('UPDATE', 'exam-question')
  update(@Param('id') id: string, @Body() dto: ExamQuestionDto) {
    return this.examQuestionService.update(this.decode(id), dto);
  }

  @Delete(':id')
  @RequirePermission('DELETE', 'exam-question')
  remove(@Param('id') id: string) {
    return this.examQuestionService.remove(this.decode(id));
  }
} 