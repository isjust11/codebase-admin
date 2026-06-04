import { Module } from '@nestjs/common';
import { GeminiController } from '../controllers/gemini/gemini.controller';
import { GeminiService } from '../services/gemini.service';
import { AuthModule } from './auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Book } from 'src/entities/book.entity';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Book])],
  controllers: [GeminiController],
  providers: [GeminiService],
  exports: [GeminiService],
})
export class GeminiModule { }
