import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Feedback } from '../entities/feedback.entity';
import { FeedbackService } from '../services/feedback.service';
import { FeedbackController } from '../controllers/feedback/feedback.controller';
import { PublicFeedbackController } from '../controllers/feedback/public-feedback.controller';
import { AuthModule } from './auth.module';

@Module({
  imports: [ AuthModule, TypeOrmModule.forFeature([Feedback])],
  controllers: [FeedbackController, PublicFeedbackController],
  providers: [FeedbackService],
  exports: [FeedbackService],
})
export class FeedbackModule {}
