import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamQuestion } from '../entities/exam-question.entity';
import { ExamQuestionService } from '../services/exam-question.service';
import { ExamQuestionController } from '../controllers/exam-question.controller';
import { RoleService } from '../services/role.service';
import { Role } from '../entities/role.entity';
import { Exam } from '../entities/exam.entity';
import { Question } from '../entities/question.entity';
import { Permission } from '../entities/permission.entity';
import { Feature } from '../entities/feature.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ExamQuestion, Role, Exam, Question, Permission, Feature])],
  providers: [ExamQuestionService, RoleService],
  controllers: [ExamQuestionController],
  exports: [ExamQuestionService],
})
export class ExamQuestionModule {} 