import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamQuestion } from '../entities/exam-question.entity';
import { ExamQuestionService } from '../services/exam-question.service';
import { ExamQuestionController } from '../controllers/exam-question.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ExamQuestion])],
  providers: [ExamQuestionService],
  controllers: [ExamQuestionController],
  exports: [ExamQuestionService],
})
export class ExamQuestionModule {} 