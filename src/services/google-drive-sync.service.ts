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
import { User } from '../entities/user.entity';
import { RoleEnum } from 'src/enums/role.enum';
import { GeminiService } from './gemini.service';
import { CategoryType } from '../entities/category-type.entity';
import { CategoryTypeEnum } from 'src/enums/category-type.enum';
import * as pdf from 'pdf-parse';
import { EPub } from 'epub2';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

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
    @InjectRepository(CategoryType)
    private readonly categoryTypeRepository: Repository<CategoryType>,
    private readonly mediaService: MediaService,
    private readonly geminiService: GeminiService,
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
            categoryId: await this.resolveCategory(bookTitle),
            statusId: pendingStatus?.id,
            description: `Đồng bộ từ Google Drive: ${file.name}`,
            publishedDate: file.modifiedTime,
          };

          // --- TRÍCH XUẤT METADATA TỪ NỘI DUNG FILE ---
          try {
            this.logger.debug(`[DriveSync] Downloading buffer to extract metadata for: ${file.name}`);
            const buffer = await this.googleDriveService.downloadFileBuffer(file.id);

            if (file.mimeType === 'application/pdf') {
              const pdfData = await (pdf as any)(buffer);
              if (pdfData.info) {
                if (pdfData.info.Title && pdfData.info.Title.trim()) {
                  bookEntity.title = pdfData.info.Title.trim();
                  this.logger.debug(`[DriveSync] Extracted PDF Title: "${bookEntity.title}"`);
                }
                if (pdfData.info.Author && pdfData.info.Author.trim()) {
                  bookEntity.author = pdfData.info.Author.trim();
                  this.logger.debug(`[DriveSync] Extracted PDF Author: "${bookEntity.author}"`);
                }
              }
            } else if (file.mimeType === 'application/epub+zip') {
              // EPub constructor expects a file path, so we write to a temp file
              const tempPath = path.join(os.tmpdir(), `sync-${file.id}.epub`);
              fs.writeFileSync(tempPath, buffer);

              try {
                const epub = new EPub(tempPath);
                await new Promise<void>((resolve, reject) => {
                  epub.on('end', () => resolve());
                  epub.on('error', (err) => reject(err));
                  epub.parse();
                });

                if (epub.metadata) {
                  if (epub.metadata.title && epub.metadata.title.trim()) {
                    bookEntity.title = epub.metadata.title.trim();
                    this.logger.debug(`[DriveSync] Extracted EPUB Title: "${bookEntity.title}"`);
                  }
                  if (epub.metadata.creator && epub.metadata.creator.trim()) {
                    bookEntity.author = epub.metadata.creator.trim();
                    this.logger.debug(`[DriveSync] Extracted EPUB Author: "${bookEntity.author}"`);
                  }
                }
              } finally {
                // Clean up temp file
                if (fs.existsSync(tempPath)) {
                  fs.unlinkSync(tempPath);
                }
              }
            }
          } catch (metaError) {
            this.logger.warn(`[DriveSync] Failed to extract internal metadata for ${file.name}: ${metaError.message}. Using filename instead.`);
          }
          // --------------------------------------------
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

  /**
   * Dùng Gemini AI để phân loại sách vào đúng danh mục.
   * Nếu chưa có danh mục phù hợp → tự động tạo mới.
   * @returns categoryId phù hợp
   */
  private async resolveCategory(bookTitle: string): Promise<number | undefined> {
    try {
      const categoryType = await this.categoryTypeRepository.findOne({ where: { name: CategoryTypeEnum.BOOK_CATEGORY } });

      // Lấy tất cả danh mục loại sách (không phải status hay feature)
      const bookCategories = await this.categoryRepository.find({
        where: { isActive: true, categoryTypeId: categoryType?.id },
        select: ['id', 'name', 'code'],
      });
      // thêm 
      const existingForGemini = bookCategories.map((c) => ({ name: c.name, code: c.code }));

      // Nhờ Gemini phân loại
      const classified = await this.geminiService.classifyBookCategory(bookTitle, existingForGemini);
      this.logger.debug(`[DriveSync] Gemini classified "${bookTitle}" → ${classified.categoryName} (isNew: ${classified.isNew})`);

      if (!classified.isNew) {
        // Tìm category có tên trùng khớp
        const matched = bookCategories.find(
          (c) => c.name.toLowerCase() === classified.categoryName.toLowerCase(),
        );
        if (matched) return matched.id;
      }


      const slug = classified.categoryNameEn.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      const newCode = `BOOK_CATEGORY_${slug.toUpperCase()}`;

      // Tránh tạo trùng nếu code đã tồn tại
      const existingByCode = await this.categoryRepository.findOne({ where: { code: newCode } });
      if (existingByCode) return existingByCode.id;

      const newCategory = this.categoryRepository.create({
        name: classified.categoryName,
        nameEN: classified.categoryNameEn,
        code: newCode,
        isActive: true,
        icon: 'bookOpen',
        iconType: 'lucide',
        categoryTypeId: categoryType?.id ?? 1,
      });

      const saved = await this.categoryRepository.save(newCategory);
      this.logger.log(`[DriveSync] Created new category: "${classified.categoryName}" (${newCode})`);
      return saved.id;
    } catch (error) {
      this.logger.warn(`[DriveSync] resolveCategory failed for "${bookTitle}": ${error.message}`);
      return undefined;
    }
  }
}
