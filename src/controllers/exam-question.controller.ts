import { Controller, Get, Post, Body, Param, Put, Delete, UseInterceptors } from '@nestjs/common';
import { ExamQuestionService } from '../services/exam-question.service';
import { ExamQuestionDto } from '../dtos/exam-question.dto';
import { EncryptionInterceptor } from 'src/interceptors/encryption.interceptor';
import { Base64EncryptionUtil } from 'src/utils/base64Encryption.util';

@Controller('exam-question')
@UseInterceptors(EncryptionInterceptor)
export class ExamQuestionController {
  constructor(private readonly examQuestionService: ExamQuestionService) {}

  @Post()
  create(@Body() dto: ExamQuestionDto) {
    return this.examQuestionService.create(dto);
  }

  @Get()
  findAll() {
    return this.examQuestionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.examQuestionService.findOne(this.decode(id));
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: ExamQuestionDto) {
    return this.examQuestionService.update(this.decode(id), dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.examQuestionService.remove(this.decode(id));
  }
  private decode(id: string) {
        const idDecode = Base64EncryptionUtil.decrypt(id);
        return parseInt(idDecode);
      }
} 