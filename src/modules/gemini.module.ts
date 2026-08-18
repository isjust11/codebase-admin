import { Module } from '@nestjs/common';
import { GeminiController } from '../controllers/gemini/gemini.controller';
import { GeminiService } from '../services/gemini.service';
import { AuthModule } from './auth.module';

@Module({
  imports: [AuthModule],
  controllers: [GeminiController],
  providers: [GeminiService],
  exports: [GeminiService],
})
export class GeminiModule { }
