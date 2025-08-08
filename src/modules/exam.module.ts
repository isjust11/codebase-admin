import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Exam } from '../entities/exam.entity';
import { Question } from '../entities/question.entity';
import { ExamQuestion } from '../entities/exam-question.entity';
import { ExamService } from '../services/exam.service';
import { ExamController } from '../controllers/exam/exam.controller';
import { UserAnswer } from 'src/entities/user-answer.entity';
import { UserAnswerService } from 'src/services/user-answer.service';
import { UserExamService } from 'src/services/user-exam.service';
import { ExamQuestionService } from 'src/services/exam-question.service';
import { QuestionService } from 'src/services/question.service';
import { UserExam } from 'src/entities/user-exam.entity';
import { ExamQuestionController } from 'src/controllers/exam/exam-question.controller';
import { QuestionController } from 'src/controllers/exam/question.controller';
import { UserAnswerController } from 'src/controllers/exam/user-answer.controller';
import { UserExamController } from 'src/controllers/exam/user-exam.controller';
import { AuthModule } from './auth.module';

@Module({
  imports: [
    AuthModule, 
    TypeOrmModule.forFeature([
    Exam, 
    Question, 
    ExamQuestion, 
    UserAnswer, 
    ExamQuestion,
    UserAnswer,
    UserExam,
  ])],
  providers: [
    ExamService, 
    QuestionService, 
    ExamQuestionService, 
    UserAnswerService, 
    UserExamService 
  ],
  controllers: [
    ExamController, 
    QuestionController, 
    ExamQuestionController, 
    UserAnswerController, 
    UserExamController
  ],
  exports: [
    ExamService, 
    QuestionService, 
    ExamQuestionService, 
    UserAnswerService, 
    UserExamService 
  ],
})
export class ExamModule {} 