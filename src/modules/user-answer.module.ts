import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserAnswer } from '../entities/user-answer.entity';
import { UserAnswerService } from '../services/user-answer.service';
import { UserAnswerController } from '../controllers/user-answer.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserAnswer])],
  providers: [UserAnswerService],
  controllers: [UserAnswerController],
  exports: [UserAnswerService],
})
export class UserAnswerModule {} 