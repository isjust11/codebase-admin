import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserExam } from '../entities/user-exam.entity';
import { UserExamService } from '../services/user-exam.service';
import { UserExamController } from '../controllers/user-exam.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserExam])],
  providers: [UserExamService],
  controllers: [UserExamController],
  exports: [UserExamService],
})
export class UserExamModule {} 