import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Book } from '../entities/book.entity';
import { FacebookService } from '../services/facebook/facebook.service';
import { FacebookAutoPostService } from '../services/jobs/facebook-auto-post.service';
import { FacebookController } from '../controllers/facebook/facebook.controller';
import { GeminiModule } from './gemini.module';

@Module({
  imports: [TypeOrmModule.forFeature([Book]), GeminiModule],
  controllers: [FacebookController],
  providers: [FacebookService, FacebookAutoPostService],
  exports: [FacebookService],
})
export class FacebookModule { }
