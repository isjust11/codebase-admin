import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class GeminiService {
  private readonly genAI: GoogleGenAI;
  private readonly modelName = 'gemini-2.5-flash-lite';

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException(
        'GEMINI_API_KEY chưa được cấu hình trong biến môi trường.',
      );
    }
    this.genAI = new GoogleGenAI({ apiKey });
  }

  /**
   * Tra cứu / giải thích một từ, khái niệm hoặc câu hỏi bằng AI
   */
  async lookup(query: string, language: string = 'vi'): Promise<string> {
    try {
      const replyLang = language === 'vi' ? 'Reply in Vietnamese.' : 'Reply in English.';

      const prompt = `${replyLang}

Query: "${query}"

If it's a word/phrase: give definition, pronunciation, a short example, and synonyms/antonyms if relevant.
If it's a concept or question: give a clear, concise explanation.
Keep the response brief and to the point.`;

      const response = await this.genAI.models.generateContent({
        model: this.modelName,
        contents: prompt,
      });

      return response.text ?? '';
    } catch (error: any) {
      console.error('GeminiService.lookup error:', error);
      throw new InternalServerErrorException(
        `Lỗi khi gọi Gemini API: ${error.message || 'Unknown error'}`,
      );
    }
  }

  /**
   * Dịch văn bản sang ngôn ngữ đích
   */
  async translate(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string,
  ): Promise<string> {
    try {
      const langMap: Record<string, string> = {
        vi: 'tiếng Việt',
        en: 'English',
        fr: 'French (Pháp)',
        ja: 'Japanese (Nhật Bản)',
        zh: 'Chinese (Trung Quốc)',
        ko: 'Korean (Hàn Quốc)',
        de: 'German (Đức)',
        es: 'Spanish (Tây Ban Nha)',
        it: 'Italian (Ý)',
        ru: 'Russian (Nga)',
        pt: 'Portuguese (Bồ Đào Nha)',
        ar: 'Arabic (Ả Rập)',
        th: 'Thai (Thái Lan)',
      };

      const targetLangLabel = langMap[targetLanguage] ?? targetLanguage;
      const sourceLangLabel = sourceLanguage
        ? (langMap[sourceLanguage] ?? sourceLanguage)
        : null;

      const prompt = `Dịch văn bản sau sang ${targetLangLabel}${sourceLangLabel ? ` (từ ${sourceLangLabel})` : ''}.
Chỉ trả về bản dịch, không giải thích, không thêm bất kỳ nội dung nào khác.

Văn bản: "${text}"`;

      const response = await this.genAI.models.generateContent({
        model: this.modelName,
        contents: prompt,
      });

      return response.text ?? '';
    } catch (error) {
      console.error('GeminiService.translate error:', error);
      throw new InternalServerErrorException(
        `Lỗi khi gọi Gemini API: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
