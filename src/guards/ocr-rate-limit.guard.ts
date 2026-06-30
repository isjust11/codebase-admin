import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { getMessages, SupportedLocale } from '../constants/messages';

/**
 * Rate-limit tạo job OCR theo từng user (sliding window in-memory).
 *
 * Cấu hình env:
 * - OCR_RATE_LIMIT_MAX (mặc định 10): số job tối đa trong cửa sổ.
 * - OCR_RATE_LIMIT_WINDOW_SEC (mặc định 60): độ dài cửa sổ (giây).
 *
 * Lưu ý: bộ nhớ cục bộ theo tiến trình — khi chạy nhiều instance nên thay bằng
 * Redis để chia sẻ trạng thái. Đủ dùng cho mức bảo vệ cơ bản hiện tại.
 */
@Injectable()
export class OcrRateLimitGuard implements CanActivate {
  private readonly max = parseInt(
    process.env.OCR_RATE_LIMIT_MAX || '10',
    10,
  );
  private readonly windowMs =
    parseInt(process.env.OCR_RATE_LIMIT_WINDOW_SEC || '60', 10) * 1000;

  private readonly hits = new Map<number, number[]>();

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const userId: number | undefined = req?.user?.id;
    if (!userId) {
      return true; // để JwtAuthGuard xử lý trường hợp chưa đăng nhập.
    }

    const now = Date.now();
    const windowStart = now - this.windowMs;
    const recent = (this.hits.get(userId) ?? []).filter((t) => t > windowStart);

    if (recent.length >= this.max) {
      const locale = this.resolveLocale(req);
      throw new HttpException(
        getMessages(locale).ocr.rateLimited,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    recent.push(now);
    this.hits.set(userId, recent);
    this.cleanup(windowStart);
    return true;
  }

  /** Dọn định kỳ các user không còn hit trong cửa sổ để tránh phình map. */
  private cleanup(windowStart: number): void {
    if (this.hits.size < 1000) {
      return;
    }
    for (const [uid, times] of this.hits) {
      const kept = times.filter((t) => t > windowStart);
      if (kept.length) {
        this.hits.set(uid, kept);
      } else {
        this.hits.delete(uid);
      }
    }
  }

  private resolveLocale(req: any): SupportedLocale {
    const header: string = req?.headers?.['accept-language'] ?? '';
    const primary = header.split(',')[0].trim().split('-')[0].toLowerCase();
    return primary === 'en' ? 'en' : 'vi';
  }
}
