import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserInteraction } from '../entities/user-interaction.entity';
import { InteractionStats } from '../entities/interaction-stats.entity';
import { Book } from '../entities/book.entity';
import { FcmToken } from '../entities/fcm-token.entity';
import { User } from '../entities/user.entity';
import { FcmService } from './fcm.service';
import { NotificationService } from './notification.service';
import { InteractionType } from '../enums/interaction-type.enum';
import { InteractionTarget } from '../enums/interaction-target.enum';
import { NotificationType } from '../enums/notification.enum';
import { SupportedLocale } from '../constants/messages';

/** Số ngày không đọc tối thiểu trước khi nhắc nhở */
const INACTIVE_DAYS = 3;

/** Số ebook hot gợi ý mỗi lần gửi */
const HOT_BOOKS_LIMIT = 5;

/** FCM multicast tối đa 500 tokens / batch */
const FCM_BATCH_SIZE = 500;

type NotifContent = { title: string; body: string };

function getContinueReadingContent(lang: string, bookTitle: string): NotifContent {
  if (lang === 'vi') {
    return {
      title: '📖 Tiếp tục đọc nào!',
      body: `Bạn đang đọc dở "${bookTitle}". Hãy tiếp tục để hoàn thành cuốn sách nhé!`,
    };
  }
  return {
    title: '📖 Continue reading!',
    body: `You left off reading "${bookTitle}". Pick up where you left off!`,
  };
}

function getHotBooksContent(lang: string, bookTitles: string[]): NotifContent {
  const list = bookTitles.slice(0, 3).join(', ');
  if (lang === 'vi') {
    return {
      title: '🔥 Ebook đang hot tuần này!',
      body: `Đừng bỏ lỡ: ${list}${bookTitles.length > 3 ? ' và nhiều hơn nữa...' : ''}`,
    };
  }
  return {
    title: '🔥 Trending ebooks this week!',
    body: `Don't miss: ${list}${bookTitles.length > 3 ? ' and more...' : ''}`,
  };
}

function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

@Injectable()
export class NotificationJobService {
  private readonly logger = new Logger(NotificationJobService.name);

  constructor(
    @InjectRepository(UserInteraction)
    private readonly interactionRepo: Repository<UserInteraction>,
    @InjectRepository(InteractionStats)
    private readonly statsRepo: Repository<InteractionStats>,
    @InjectRepository(Book)
    private readonly bookRepo: Repository<Book>,
    @InjectRepository(FcmToken)
    private readonly fcmTokenRepo: Repository<FcmToken>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly fcmService: FcmService,
    private readonly notificationService: NotificationService,
  ) { }

  /**
   * Job 1: Nhắc nhở người dùng tiếp tục đọc ebook đang đọc dở.
   * Chạy hàng ngày lúc 20:00 (giờ VN, UTC+7 → 13:00 UTC).
   *
   * Điều kiện: UserInteraction với interactionType=READING, status=1 (đang đọc)
   * và updatedAt < (hiện tại - 3 ngày).
   */
  @Cron('0 13 * * *', { name: 'continue-reading-notification', timeZone: 'Asia/Ho_Chi_Minh' })
  async sendContinueReadingNotifications() {
    this.logger.log('[ContinueReading] Job started');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - INACTIVE_DAYS);

    // Lấy các READING interactions đang dở và không có ai đọc trong INACTIVE_DAYS ngày
    const interactions = await this.interactionRepo
      .createQueryBuilder('i')
      .where('i.interactionType = :type', { type: InteractionType.READING })
      .andWhere('i.status = 1')
      .andWhere('i.updatedAt < :cutoff', { cutoff: cutoffDate })
      .leftJoinAndSelect('i.book', 'book')
      .getMany();

    if (interactions.length === 0) {
      this.logger.log('[ContinueReading] No inactive readers found');
      return;
    }

    let sent = 0;
    let skipped = 0;

    for (const interaction of interactions) {
      try {
        const book = interaction.book;
        if (!book) continue;

        const fcmToken = await this.fcmTokenRepo.findOne({
          where: { userId: interaction.userId, isActive: true },
          order: { updatedAt: 'DESC' },
        });
        if (!fcmToken) {
          skipped++;
          continue;
        }

        // Lấy ngôn ngữ từ user profile
        const user = await this.userRepo.findOne({ where: { id: interaction.userId } });
        const lang = user?.region ? user.region.split('-')[0].toLowerCase() : 'en';
        const locale: SupportedLocale = lang === 'vi' ? 'vi' : 'en';

        const content = getContinueReadingContent(lang, book.title);
        const data: Record<string, string> = {
          bookId: String(book.id),
          type: NotificationType.CONTINUE_READING,
        };

        await this.fcmService.sendToToken(fcmToken.token, {
          title: content.title,
          body: content.body,
          type: NotificationType.CONTINUE_READING,
          data,
        });

        await this.notificationService.newNotification(
          NotificationType.CONTINUE_READING,
          data,
          content.title,
          content.body,
          interaction.userId,
        );

        sent++;
      } catch (err) {
        this.logger.warn(`[ContinueReading] userId=${interaction.userId} failed: ${err?.message}`);
      }
    }

    this.logger.log(`[ContinueReading] Done — sent=${sent}, skipped=${skipped}`);
  }

  /**
   * Job 2: Gợi ý ebook đang hot mỗi đầu tuần.
   * Chạy mỗi thứ Hai lúc 09:00 (giờ VN, UTC+7 → 02:00 UTC).
   *
   * Chọn top HOT_BOOKS_LIMIT books có readCount cao nhất trong 7 ngày qua
   * (dựa trên InteractionStats), gửi broadcast tới tất cả user có FCM token active.
   */
  @Cron('0 2 * * 1', { name: 'hot-books-notification', timeZone: 'Asia/Ho_Chi_Minh' })
  async sendHotBooksNotifications() {
    this.logger.log('[HotBooks] Job started');

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Tìm top books có readCount cao nhất trong 7 ngày gần đây (dùng UserInteraction để lọc time)
    const hotBookRows: { bookId: number; cnt: number }[] = await this.interactionRepo
      .createQueryBuilder('i')
      .select('i.bookId', 'bookId')
      .addSelect('COUNT(*)', 'cnt')
      .where('i.interactionType = :type', { type: InteractionType.READ })
      .andWhere('i.updatedAt >= :since', { since: sevenDaysAgo })
      .andWhere('i.bookId IS NOT NULL')
      .groupBy('i.bookId')
      .orderBy('cnt', 'DESC')
      .limit(HOT_BOOKS_LIMIT)
      .getRawMany();

    if (hotBookRows.length === 0) {
      this.logger.log('[HotBooks] No hot books found this week');
      return;
    }

    const bookIds = hotBookRows.map((r) => Number(r.bookId));
    const books = await this.bookRepo.findByIds(bookIds);
    if (books.length === 0) return;

    const bookTitles = books.map((b) => b.title);
    const bookIdsStr = bookIds.join(',');

    // Lấy tất cả FCM tokens active
    const allTokens = await this.fcmTokenRepo.find({ where: { isActive: true } });
    if (allTokens.length === 0) {
      this.logger.log('[HotBooks] No active FCM tokens found');
      return;
    }

    // Gom tokens theo ngôn ngữ user
    const userIds = [...new Set(allTokens.map((t) => t.userId).filter(Boolean))];
    const users = await this.userRepo.findByIds(userIds);
    const userLangMap = new Map<number, string>();
    for (const u of users) {
      const lang = u.region ? u.region.split('-')[0].toLowerCase() : 'en';
      userLangMap.set(u.id, lang);
    }

    // Phân nhóm tokens theo ngôn ngữ
    const tokensByLang: Record<string, string[]> = {};
    for (const t of allTokens) {
      const lang = (t.userId && userLangMap.get(t.userId)) || 'en';
      if (!tokensByLang[lang]) tokensByLang[lang] = [];
      tokensByLang[lang].push(t.token);
    }

    let totalSent = 0;
    let totalFailed = 0;

    for (const [lang, tokens] of Object.entries(tokensByLang)) {
      const content = getHotBooksContent(lang, bookTitles);
      const data: Record<string, string> = {
        bookIds: bookIdsStr,
        type: NotificationType.HOT_BOOKS,
      };

      // Chia batch 500 tokens (giới hạn FCM)
      const batches = chunk(tokens, FCM_BATCH_SIZE);
      for (const batch of batches) {
        try {
          const result = await this.fcmService.sendToTokens(batch, {
            title: content.title,
            body: content.body,
            type: NotificationType.HOT_BOOKS,
            data,
          });
          if (result) {
            totalSent += result.successCount ?? 0;
            totalFailed += result.failureCount ?? 0;
          }
        } catch (err) {
          this.logger.warn(`[HotBooks] batch(lang=${lang}) failed: ${err?.message}`);
        }
      }
    }

    this.logger.log(`[HotBooks] Done — sent=${totalSent}, failed=${totalFailed}, books=[${bookIdsStr}]`);
  }
}
