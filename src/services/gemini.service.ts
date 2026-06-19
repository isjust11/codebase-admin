import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { BookService } from './book.service';
import { Book } from 'src/entities/book.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class GeminiService {
  private readonly genAI: GoogleGenAI;
  private readonly genAIAdmin: GoogleGenAI;
  private readonly modelName = 'gemini-2.5-flash-lite';

  constructor(private readonly configService: ConfigService,
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    const apiAdminKey = this.configService.get<string>('GEMINI_API_ADMIN_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException(
        'GEMINI_API_KEY chưa được cấu hình trong biến môi trường.',
      );
    }
    if (!apiAdminKey) {
      throw new InternalServerErrorException(
        'GEMINI_API_ADMIN_KEY chưa được cấu hình trong biến môi trường.',
      );
    }
    this.genAI = new GoogleGenAI({ apiKey });
    this.genAIAdmin = new GoogleGenAI({ apiKey: apiAdminKey });
  }

  /**
   * Tra cứu / giải thích một từ, khái niệm hoặc câu hỏi bằng AI
   * @param query Từ hoặc nội dung cần tra cứu
   * @param language Ngôn ngữ trả lời ('vi' hoặc 'en', mặc định 'vi')
   */
  async lookup(query: string, ebookId: number, language: string = 'vi'): Promise<string> {
    try {

      const bookData = await this.bookRepository.findOneBy({ id: ebookId });

      const bookContext = bookData
        ? `Book: "${bookData.title}"${bookData.author ? ` by ${bookData.author}` : ''}${bookData.description ? `\nSynopsis: ${bookData.description.slice(0, 200)}` : ''}`
        : '';

      const replyLang = language === 'vi' ? 'Reply in Vietnamese.' : 'Reply in English.';

      const prompt = `${replyLang}${bookContext ? `\nContext — ${bookContext}` : ''}

Query: "${query}"

If it's a word/phrase: give definition, pronunciation, a short example, and synonyms/antonyms if relevant.
If it's a concept or question: give a clear, concise explanation.
Keep the response brief and to the point.`;

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
  //  generateBook Cover
  async generateBookCover(title: string, author: string): Promise<string> {
    try {
      const prompt = `A professional and creative book cover design for a book titled "${title}" written by ${author}. High quality, elegant typography, modern design, digital art, no text spelling errors.`;

      const response = await this.genAI.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          aspectRatio: '3:4', // Tỉ lệ chuẩn cho bìa sách
        }
      });

      const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
      if (!imageBytes) {
        throw new Error('Không có ảnh được tạo từ API');
      }

      // Trả về chuỗi Base64 dưới dạng Data URI để dễ dàng lưu hoặc hiển thị
      return `data:image/jpeg;base64,${imageBytes}`;
    } catch (error) {
      console.error('GeminiService.generateBookCover error:', error);
      throw new InternalServerErrorException(
        `Lỗi khi gọi Gemini API: ${error.message || 'Unknown error'}`,
      );
    }
  }

  /**
   * Phân loại sách vào danh mục phù hợp dựa trên tên sách
   * @param bookTitle Tên sách
   * @param existingCategories Danh sách các danh mục đã có (name, code)
   */
  async classifyBookCategory(
    bookTitle: string,
    existingCategories: { name: string; code: string }[],
  ): Promise<{ categoryName: string; categoryNameEn: string; isNew: boolean }> {
    try {
      const categoryList = existingCategories
        .map((c) => `${c.name}|${c.code}`)
        .join(', ');

      const prompt = `Classify book "${bookTitle}" into best matching category.
      Categories: [${categoryList}]
      If match found: return exact name, isNew:false.
      If no match: suggest new short Vietnamese name (1-3 words), isNew:true.
      JSON only: {"categoryName":"vi","categoryNameEn":"en","isNew":bool}`;

      const response = await this.genAIAdmin.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });

      const text = (response.text ?? '').trim();
      const jsonText = text.replace(/^```json\s*|\s*```$/g, '').trim();
      return JSON.parse(jsonText);
    } catch (error) {
      console.error('GeminiService.classifyBookCategory error:', error);
      return { categoryName: 'Khác', categoryNameEn: 'Other', isNew: false };
    }
  }

  /**
   * Tạo nội dung bài đăng Facebook hấp dẫn
   */
  async generateFacebookPost(title: string, author: string): Promise<string> {
    try {
      const prompt = `Viết một caption Facebook ngắn gọn, lôi cuốn (dưới 40 từ) để giới thiệu sách "${title}"${author ? ` của ${author}` : ''}. Có dùng 1-2 emoji. Không cần hashtag. Dừng lại ở câu gợi mở.`;

      const response = await this.genAIAdmin.models.generateContent({
        model: this.modelName,
        contents: prompt,
      });

      return (response.text ?? '').trim() || `📚 Sách hay chia sẻ: ${title}`;
    } catch (error) {
      console.error('GeminiService.generateFacebookPost error:', error);
      return `📚 Sách hay chia sẻ: ${title}${author ? ` - Tác giả: ${author}` : ''}`;
    }
  }
}
