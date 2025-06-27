import { Controller, Get, Post, Body, Param, Put, Delete, UseInterceptors, Query } from '@nestjs/common';
import { ExamService } from '../services/exam.service';
import { ExamDto } from '../dtos/exam.dto';
import { EncryptionInterceptor } from 'src/interceptors/encryption.interceptor';
import { Base64EncryptionUtil } from 'src/utils/base64Encryption.util';
import { CreateQuestionDto } from '../dtos/question.dto';
import { PaginationParams } from 'src/dtos/filter.dto';

@Controller('exam')
@UseInterceptors(EncryptionInterceptor)
export class ExamController {
  constructor(private readonly examService: ExamService) { }

  @Post()
  create(@Body() dto: ExamDto) {
    return this.examService.create(dto);
  }

   @Get()
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
  findAll() {
    return this.examService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.examService.findOne(this.decode(id));
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: ExamDto) {
    return this.examService.update(this.decode(id), dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.examService.remove(this.decode(id));
  }

  @Post(':id/questions')
  createQuestionsForExam(@Param('id') id: string, @Body() body: { questions: CreateQuestionDto[] }) {
    return this.examService.createQuestionsForExam(this.decode(id), body.questions);
  }

  @Get(':id/questions')
  getQuestionsByExam(@Param('id') id: string) {
    return this.examService.getQuestionsByExam(this.decode(id));
  }

  private decode(id: string) {
    const idDecode = Base64EncryptionUtil.decrypt(id);
    return parseInt(idDecode);
  }
} 