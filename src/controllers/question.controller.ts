import { Controller, Get, Post, Body, Param, Put, Delete, UseInterceptors } from '@nestjs/common';
import { QuestionService } from '../services/question.service';
import { QuestionDto } from '../dtos/question.dto';
import { EncryptionInterceptor } from 'src/interceptors/encryption.interceptor';
import { Base64EncryptionUtil } from 'src/utils/base64Encryption.util';
import { RequirePermission } from 'src/decorators/require-permissions.decorator';
import { BaseController } from './base.controller';

@Controller('question')
@UseInterceptors(EncryptionInterceptor)
export class QuestionController extends BaseController{
  constructor(private readonly questionService: QuestionService) {
    super();
  }

  @Post()
  @RequirePermission('CREATE', 'question')
  create(@Body() dto: QuestionDto) {
    return this.questionService.create(dto);
  }

  @Get()
  @RequirePermission('READ', 'question')
  findAll() {
    return this.questionService.findAll();
  }

  @Get(':id')
  @RequirePermission('READ', 'question')
  findOne(@Param('id') id: string) {
    return this.questionService.findOne(this.decode(id));
  }

  @Put(':id')
  @RequirePermission('UPDATE', 'question')
  update(@Param('id') id: string, @Body() dto: QuestionDto) {
    return this.questionService.update(this.decode(id), dto);
  }

  @Delete(':id')
  @RequirePermission('DELETE', 'question')
  remove(@Param('id') id: string) {
    return this.questionService.remove(this.decode(id));
  }
} 