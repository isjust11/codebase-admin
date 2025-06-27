import { Controller, Get, Post, Body, Param, Put, Delete, UseInterceptors } from '@nestjs/common';
import { UserExamService } from '../services/user-exam.service';
import { UserExamDto } from '../dtos/user-exam.dto';
import { EncryptionInterceptor } from 'src/interceptors/encryption.interceptor';
import { Base64EncryptionUtil } from 'src/utils/base64Encryption.util';

@Controller('user-exam')
@UseInterceptors(EncryptionInterceptor)
export class UserExamController {
  constructor(private readonly userExamService: UserExamService) { }

  @Post()
  create(@Body() dto: UserExamDto) {
    return this.userExamService.create(dto);
  }

  @Get()
  findAll() {
    return this.userExamService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userExamService.findOne(this.decode(id));
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UserExamDto) {
    return this.userExamService.update(this.decode(id), dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userExamService.remove(this.decode(id));
  }

  @Get('by-user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.userExamService.findByUser(this.decode(userId));
  }

  @Get('activated/by-user/:userId')
  findActivatedByUser(@Param('userId') userId: string) {
    return this.userExamService.findActivatedByUser(this.decode(userId));
  }

  @Post('pay')
  payForExam(@Body() body: { userId: number; examId: number; paymentMethod?: string; transactionId?: string }) {
    return this.userExamService.payForExam(body.userId, body.examId, body);
  }

  @Post('activate')
  activateExamForUser(@Body() body: { userId: number; examId: number }) {
    return this.userExamService.activateExamForUser(body.userId, body.examId);
  }
  private decode(id: string) {
    const idDecode = Base64EncryptionUtil.decrypt(id);
    return parseInt(idDecode);
  }
} 