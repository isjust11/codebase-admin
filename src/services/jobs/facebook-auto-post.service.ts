import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Book } from '../../entities/book.entity';
import { FacebookService } from '../facebook/facebook.service';
import { GeminiService } from '../gemini.service';
import { Base64EncryptionUtil } from 'src/utils/base64Encryption.util';

@Injectable()
export class FacebookAutoPostService {
  private readonly logger = new Logger(FacebookAutoPostService.name);

  constructor(
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
    private readonly facebookService: FacebookService,
    private readonly geminiService: GeminiService,
  ) { }

  // Chạy lúc 9:00 sáng và 20:00 (8h tối) mỗi ngày theo giờ Việt Nam
  @Cron('0 9,20 * * *', {
    name: 'facebook-auto-post',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async handleCron() {
    this.logger.log('Bắt đầu chạy Cron Job: Đăng bài tự động lên Facebook');

    try {
      // Tìm 1 cuốn sách isPublic = true, và isPostedToFacebook = false
      const bookToPost = await this.bookRepository.findOne({
        where: {
          isPublic: true,
          isPostedToFacebook: false,
        },
        order: {
          createdAt: 'DESC', // Ưu tiên sách mới nhất
        },
      });

      if (!bookToPost) {
        this.logger.log('Không có sách nào thỏa mãn điều kiện để đăng lên Facebook.');
        return;
      }

      const bookTitle = bookToPost.title;
      const bookAuthor = bookToPost.author;
      const encodeId = Base64EncryptionUtil.encrypt(bookToPost.id);
      const shareLink = `https://readbox.pro.vn/book/${encodeId}`;

      // Sử dụng Gemini để tạo caption hấp dẫn và ngắn gọn
      const introText = await this.geminiService.generateFacebookPost(bookTitle, bookAuthor);
      const message = `${introText}\n\n- Đọc ngay tại: ${shareLink}`;

      // Xử lý thumbnail url (nếu là đường dẫn tương đối thì thêm APP_URL)
      let thumbUrl = bookToPost.coverImageUrl;
      if (thumbUrl && thumbUrl.startsWith('/')) {
        const appUrl = process.env.APP_URL || 'https://api.readbox.pro.vn';
        thumbUrl = `${appUrl}${thumbUrl}`;
      }

      const isSuccess = await this.facebookService.postToFeed(message, shareLink, thumbUrl);

      if (isSuccess) {
        // Cập nhật trạng thái đã đăng
        bookToPost.isPostedToFacebook = true;
        await this.bookRepository.save(bookToPost);
        this.logger.log(`Đã lưu trạng thái đăng thành công cho sách ID: ${bookToPost.id}`);
      }
    } catch (error: any) {
      this.logger.error('Lỗi khi chạy Cron Job Facebook Auto Post', error.stack);
    }
  }
}
