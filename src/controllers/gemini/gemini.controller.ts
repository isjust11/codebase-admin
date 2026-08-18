import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { GeminiService } from '../../services/gemini.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PermissionGuard } from '../../guards/permission.guard';
import { LookupRequestDto } from '../../dtos/gemini/lookup-request.dto';
import { TranslateRequestDto } from '../../dtos/gemini/translate-request.dto';
import { BaseController } from '../base/base.controller';

@Controller('ai')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class GeminiController extends BaseController {
  constructor(private readonly geminiService: GeminiService) {
    super();
  }

  @Post('lookup')
  @HttpCode(HttpStatus.OK)
  async lookup(
    @Body() dto: LookupRequestDto,
    @Req() req: Request,
  ) {
    const language = req.headers['x-custom-lang'] || dto.language || 'vi';
    try {
      const result = await this.geminiService.lookup(dto.query, language);
      return {
        status: true,
        message: 'Tra cứu thành công',
        data: result,
      };
    } catch (error: any) {
      console.error('Error in lookup:', error);
      return {
        status: false,
        message: error.message || 'Lỗi khi tra cứu',
        code: error.status || 500,
      };
    }
  }

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
    } catch (error: any) {
      console.error('Error in translate:', error);
      return {
        status: false,
        message: error.message || 'Lỗi khi dịch thuật',
        code: error.status || 500,
      };
    }
  }
}
