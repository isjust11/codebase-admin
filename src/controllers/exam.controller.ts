import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { ExamService } from '../services/exam.service';
import { ExamDto } from '../dtos/exam.dto';
import { CreateQuestionDto } from '../dtos/question.dto';
import { PaginationParams } from 'src/dtos/filter.dto';
import { BaseController } from './base.controller';
import { RequirePermission } from 'src/decorators/require-permissions.decorator';
import { PermissionGuard } from 'src/guards/permission.guard';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

@Controller('exam')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ExamController extends BaseController{
  constructor(private readonly examService: ExamService) {
    super();
  }

  @Post()
  @RequirePermission('CREATE', 'exam')
  create(@Body() dto: ExamDto) {
    return this.examService.create(dto);
  }

   @Get()
   @RequirePermission('READ', 'exam')
    async getByPage(
      @Query('page') page: number,
      @Query('size') size: number,
      @Query('search') search: string,
    ) {
      const filter: PaginationParams = {
        page: page || 1,
        size: size || 10,
        search: search || '',
      };
      return this.examService.findPagination(filter);
    }

  @Get('all')
  @RequirePermission('READ', 'exam')
  findAll() {
    return this.examService.findAll();
  }

  @Get(':id')
  @RequirePermission('READ', 'exam')
  findOne(@Param('id') id: string) {
    return this.examService.findOne(this.decode(id));
  }

  @Put(':id')
  @RequirePermission('UPDATE', 'exam')
  update(@Param('id') id: string, @Body() dto: ExamDto) {
    return this.examService.update(this.decode(id), dto);
  }

  @Delete(':id')
  @RequirePermission('DELETE', 'exam')
  remove(@Param('id') id: string) {
    return this.examService.remove(this.decode(id));
  }

  @Post(':id/questions')
  @RequirePermission('UPDATE', 'exam')
  createQuestionsForExam(@Param('id') id: string, @Body() body: { questions: CreateQuestionDto[] }) {
    return this.examService.createQuestionsForExam(this.decode(id), body.questions);
  }

  @Get(':id/questions')
  @RequirePermission('READ', 'exam')
    getQuestionsByExam(@Param('id') id: string) {
    return this.examService.getQuestionsByExam(this.decode(id));
  }
} 