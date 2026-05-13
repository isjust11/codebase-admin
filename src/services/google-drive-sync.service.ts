import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { GoogleDriveService } from './google-drive.service';
import { Media } from '../entities/media.entity';
import { Book } from '../entities/book.entity';
import { Category } from '../entities/category.entity';
import { CategoryCodeEnum } from 'src/enums/category-code.enum';
import { MediaService } from './media.service';
import { CreateBookDto } from 'src/dtos/book.dto';
import { User } from '../entities/user.entity';
import { RoleEnum } from 'src/enums/role.enum';

@Injectable()
export class GoogleDriveSyncService {
  private readonly logger = new Logger(GoogleDriveSyncService.name);
  private isSyncing = false;
  private lastSyncAt: Date | null = null;

  constructor(
    private readonly googleDriveService: GoogleDriveService,
    private readonly configService: ConfigService,
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly mediaService: MediaService,
  ) { }

  /**
   * Cron job chạy mỗi 2 giờ để đồng bộ ebook mới từ Google Drive
   * Có thể thay đổi lịch bằng cách sửa GOOGLE_DRIVE_SYNC_CRON trong .env
   */
  @Cron(CronExpression.EVERY_2_HOURS)
  async scheduledSync() {
    const enabled = this.configService.get<string>('GOOGLE_DRIVE_SYNC_ENABLED');
    if (enabled !== 'true') {
      return;
    }
    await this.syncFromDrive();
  }

  /**
   * Thực hiện đồng bộ thủ công (gọi từ controller)
   */
  async syncFromDrive(options?: { force?: boolean }): Promise<{
    synced: number;
    skipped: number;
    errors: number;
    details: string[];
  }> {
    if (this.isSyncing && !options?.force) {
      this.logger.warn('[DriveSync] Sync already in progress. Skipping.');
      return { synced: 0, skipped: 0, errors: 0, details: ['Sync already in progress'] };
    }

    if (!this.googleDriveService.isConfigured()) {
      this.logger.warn('[DriveSync] Google Drive not configured. Skipping sync.');
      return { synced: 0, skipped: 0, errors: 0, details: ['Google Drive not configured'] };
    }

    const folderId = this.configService.get<string>('GOOGLE_DRIVE_FOLDER_ID');
    if (!folderId) {
      this.logger.warn('[DriveSync] GOOGLE_DRIVE_FOLDER_ID not set. Skipping.');
      return { synced: 0, skipped: 0, errors: 0, details: ['GOOGLE_DRIVE_FOLDER_ID not configured'] };
    }

    this.isSyncing = true;
    const result = { synced: 0, skipped: 0, errors: 0, details: [] as string[] };

    try {
      this.logger.log(`[DriveSync] Starting sync from folder: ${folderId}`);

      // Chỉ lấy file mới hơn lần sync cuối (incremental sync)
      const files = await this.googleDriveService.listEbooks(
        folderId,
        options?.force ? undefined : this.lastSyncAt ?? undefined,
      );

      this.logger.log(`[DriveSync] Processing ${files.length} file(s)...`);

      // Lấy status "pending" để gán cho sách mới
      const pendingStatus = await this.categoryRepository.findOne({
        where: { code: CategoryCodeEnum.BOOK_STATUS_PENDING },
      });

      // Lấy tài khoản Super Admin để gán quyền sở hữu sách
      const superAdmin = await this.userRepository.findOne({
        where: { roles: { code: RoleEnum.SUPPER_ADMIN } },
        relations: ['roles'],
      });
      const adminId = superAdmin?.id || 3; // Fallback về 3 nếu không tìm thấy

      for (const file of files) {
        try {
          // Kiểm tra đã tồn tại chưa (bằng googleDriveFileId)
          const existing = await this.mediaRepository.findOne({
            where: { googleDriveFileId: file.id },
          });

          if (existing) {
            result.skipped++;
            result.details.push(`[SKIP] ${file.name} (already imported)`);
            continue;
          }

          // Kiểm tra trùng tên sách trong DB
          const bookTitle = this.extractBookTitle(file.name);
          const duplicateBook = await this.bookRepository.findOne({
            where: { title: bookTitle },
          });

          if (duplicateBook) {
            result.skipped++;
            result.details.push(`[SKIP] ${file.name} (book with same title exists)`);
            continue;
          }

          // Dùng proxy endpoint trên backend thay vì URL trực tiếp Google Drive
          // File trên Drive chỉ share cho Service Account, không public
          // → Flutter app tải qua backend: /google-drive/download/{fileId}
          const proxyDownloadUrl = `google-drive/download/${file.id}`;

          // Tạo Media record (do hệ thống tạo, không thuộc user cụ thể)
          const media = new Media();
          media.filename = file.name;
          media.originalName = file.name;
          media.mimeType = file.mimeType;
          media.size = file.size;
          media.path = proxyDownloadUrl;
          media.publicRelativePath = proxyDownloadUrl;
          media.url = proxyDownloadUrl;
          media.googleDriveFileId = file.id;
          media.isDeleted = false;
          media.userId = adminId;
          await this.mediaRepository.save(media);
          const bookEntity: Partial<Book> = {
            title: bookTitle,
            author: this.extractAuthor(file.name),
            fileUrl: proxyDownloadUrl,
            fileSize: file.size,
            language: 'vi',
            isPublic: false,
            createById: adminId,
            categoryId: pendingStatus?.id,
            statusId: pendingStatus?.id,
            description: `Đồng bộ từ Google Drive: ${file.name}`,
            publishedDate: file.modifiedTime,
          };
          // Tạo Book record từ thông tin Drive
          const book = this.bookRepository.create(bookEntity);

          // Xử lý Thumbnail nếu có
          if (file.thumbnailLink) {
            try {
              const thumbnailBuffer = await this.googleDriveService.downloadThumbnail(file.thumbnailLink);
              if (thumbnailBuffer) {
                const coverMedia = await this.mediaService.uploadFromBuffer(
                  thumbnailBuffer,
                  `cover-${file.name}.jpg`,
                  'image/jpeg',
                  'book-covers',
                  adminId
                );
                book.coverImageUrl = coverMedia.url;
              }
            } catch (thumbError) {
              this.logger.warn(`[DriveSync] Failed to process thumbnail for ${file.name}: ${thumbError.message}`);
            }
          }

          await this.bookRepository.save(book);

          result.synced++;
          result.details.push(`[OK] ${file.name} → Book: "${bookTitle}"`);
          this.logger.log(`[DriveSync] Synced: ${file.name}`);

        } catch (fileError) {
          result.errors++;
          result.details.push(`[ERROR] ${file.name}: ${fileError.message}`);
          this.logger.error(`[DriveSync] Error processing ${file.name}: ${fileError.message}`);
        }
      }

      this.lastSyncAt = new Date();
      this.logger.log(
        `[DriveSync] Completed. Synced: ${result.synced}, Skipped: ${result.skipped}, Errors: ${result.errors}`,
      );

    } catch (error) {
      this.logger.error(`[DriveSync] Fatal error: ${error.message}`, error.stack);
      result.details.push(`[FATAL] ${error.message}`);
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  /**
   * Trích xuất tiêu đề sách từ tên file (bỏ extension)
   * Ví dụ: "The_Great_Gatsby - F. Scott Fitzgerald.epub" → "The Great Gatsby"
   */
  private extractBookTitle(filename: string): string {
    const withoutExt = filename.replace(/\.(epub|pdf|mobi|azw|azw3|fb2)$/i, '');
    // Nếu tên file có dấu " - " phân cách tác giả, lấy phần trước
    const parts = withoutExt.split(/\s+-\s+/);
    return parts[0].replace(/_/g, ' ').trim();
  }

  /**
   * Trích xuất tác giả từ tên file nếu có định dạng "Tựa đề - Tác giả.epub"
   */
  private extractAuthor(filename: string): string {
    const withoutExt = filename.replace(/\.(epub|pdf|mobi|azw|azw3|fb2)$/i, '');
    const parts = withoutExt.split(/\s+-\s+/);
    return parts.length > 1 ? parts[1].replace(/_/g, ' ').trim() : 'Unknown';
  }

  getStatus(): { isSyncing: boolean; lastSyncAt: Date | null } {
    return {
      isSyncing: this.isSyncing,
      lastSyncAt: this.lastSyncAt,
    };
  }
}
