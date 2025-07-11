import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Exam } from '../entities/exam.entity';
import { Question } from '../entities/question.entity';
import { ExamQuestion } from '../entities/exam-question.entity';
import { ExamService } from '../services/exam.service';
import { ExamController } from '../controllers/exam.controller';
import { RoleService } from '../services/role.service';
import { Role } from '../entities/role.entity';
import { User } from '../entities/user.entity';
import { Permission } from '../entities/permission.entity';
import { Feature } from '../entities/feature.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Exam, Question, ExamQuestion, Role, User, Permission, Feature])],
  providers: [ExamService, RoleService],
  controllers: [ExamController],
  exports: [ExamService],
})
export class ExamModule {} 