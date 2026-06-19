import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class FacebookService {
  private readonly logger = new Logger(FacebookService.name);
  private readonly pageId = process.env.FACEBOOK_PAGE_ID;
  private readonly accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

  async postToFeed(message: string, link: string, imageUrl?: string): Promise<boolean> {
    if (!this.pageId || !this.accessToken) {
      this.logger.warn('Thiếu cấu hình FACEBOOK_PAGE_ID hoặc FACEBOOK_PAGE_ACCESS_TOKEN. Bỏ qua auto-post.');
      return false;
    }

    try {
      if (imageUrl) {
        // Đăng ảnh kèm text caption
        const url = `https://graph.facebook.com/v25.0/${this.pageId}/photos?access_token=${this.accessToken}`;
        const response = await axios.post(url, {
          message: message, // Message đã chứa link chia sẻ
          url: imageUrl,
        });
        this.logger.log(`Posted photo to Facebook successfully. Post ID: ${response.data.id}`);
      } else {
        // Đăng link bài viết thông thường
        const url = `https://graph.facebook.com/v25.0/${this.pageId}/feed?access_token=${this.accessToken}`;
        const response = await axios.post(url, {
          message,
          link,
        });
        this.logger.log(`Posted link to Facebook successfully. Post ID: ${response.data.id}`);
      }

      return true;
    } catch (error: any) {
      this.logger.error(
        `Failed to post to Facebook: ${error.response?.data?.error?.message || error.message}`,
        error.stack,
      );
      return false;
    }
  }
}
