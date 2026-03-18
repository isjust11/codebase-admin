import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { GeminiService } from '../../services/gemini.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PermissionGuard } from '../../guards/permission.guard';
import { LookupRequestDto } from '../../dtos/gemini/lookup-request.dto';
import { TranslateRequestDto } from '../../dtos/gemini/translate-request.dto';

@Controller('ai')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class GeminiController {
  constructor(private readonly geminiService: GeminiService) {}

  /**
   * Tra cứu / giải thích từ hoặc khái niệm bằng AI
   * POST /ai/lookup
   */
  @Post('lookup')
  @HttpCode(HttpStatus.OK)
  async lookup(@Body() dto: LookupRequestDto) {
    try {
      const result = await this.geminiService.lookup(dto.query, dto.language);
      return {
        status: true,
        message: 'Tra cứu thành công',
        data: result,
      };
    } catch (error) {
      console.error('Error in lookup:', error);
      return {
        status: false,
        message: error.message || 'Lỗi khi tra cứu',
        code: error.status || 500,
      };
    }
  }

  /**
   * Dịch thuật văn bản bằng AI
   * POST /ai/translate
   */
  @Post('translate')
  @HttpCode(HttpStatus.OK)
  async translate(@Body() dto: TranslateRequestDto) {
    try {
      const result = await this.geminiService.translate(
        dto.text,
        dto.targetLanguage,
        dto.sourceLanguage,
      );
      return {
        status: true,
        message: 'Dịch thuật thành công',
        data: result,
      };
    } catch (error) {
      console.error('Error in translate:', error);
      return {
        status: false,
        message: error.message || 'Lỗi khi dịch thuật',
        code: error.status || 500,
      };
    }
  }
}
