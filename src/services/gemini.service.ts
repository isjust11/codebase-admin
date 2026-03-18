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
   * @param query Từ hoặc nội dung cần tra cứu
   * @param language Ngôn ngữ trả lời ('vi' hoặc 'en', mặc định 'vi')
   */
  async lookup(query: string, language: string = 'vi'): Promise<string> {
    try {
      const langInstruction =
        language === 'en'
          ? 'Please respond in English.'
          : 'Hãy trả lời bằng tiếng Việt.';

      const prompt = `${langInstruction}

Tra cứu và giải thích chi tiết về: "${query}"

Nếu là từ vựng, hãy bao gồm:
- Định nghĩa / ý nghĩa
- Phiên âm (nếu có)
- Ví dụ sử dụng
- Từ đồng nghĩa / trái nghĩa (nếu có)

Nếu là khái niệm hoặc câu hỏi, hãy giải thích rõ ràng, ngắn gọn và đầy đủ.`;

      const response = await this.genAI.models.generateContent({
        model: this.modelName,
        contents: prompt,
      });

      return response.text ?? '';
    } catch (error) {
      console.error('GeminiService.lookup error:', error);
      throw new InternalServerErrorException(
        `Lỗi khi gọi Gemini API: ${error.message || 'Unknown error'}`,
      );
    }
  }

  /**
   * Dịch văn bản sang ngôn ngữ đích
   * @param text Văn bản cần dịch
   * @param targetLanguage Ngôn ngữ đích (ví dụ: 'vi', 'en', 'fr', 'ja', 'zh')
   * @param sourceLanguage Ngôn ngữ nguồn (optional, mặc định auto-detect)
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
        `Lỗi khi gọi Gemini API: ${error.message || 'Unknown error'}`,
      );
    }
  }
}
