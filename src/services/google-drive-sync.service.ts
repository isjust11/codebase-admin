import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import pLimit from 'p-limit';
import { GoogleDriveService, DriveFileInfo } from './google-drive.service';
import { Media } from '../entities/media.entity';
import { Book } from '../entities/book.entity';
import { BookFile, EbookFormat } from '../entities/book-file.entity';
import { Category } from '../entities/category.entity';
import { SyncState } from '../entities/sync-state.entity';
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
import {
  buildMatchKey,
  guessAuthorFromFilename,
  guessTitleFromFilename,
  normalizeText,
} from '../utils/text-normalize.util';
import {
  detectEbookFormat,
  lightweightHash,
  pickPrimaryFormat,
} from '../utils/ebook-format.util';
import { BookFileService } from './book-file.service';

const SYNC_JOB_NAME = 'google_drive_ebook_sync';

interface ExtractedMetadata {
  title?: string;
  author?: string;
  totalPages?: number;
}

interface ProcessedFile {
  drive: DriveFileInfo;
  format: EbookFormat;
  buffer?: Buffer;
  metadata: ExtractedMetadata;
  hash?: string;
}

@Injectable()
export class GoogleDriveSyncService implements OnModuleInit {
  private readonly logger = new Logger(GoogleDriveSyncService.name);
  private isSyncing = false;

  /** Số metadata extraction chạy đồng thời (PDF/EPUB parse rất nặng RAM). */
  private readonly metadataConcurrency = 3;

  constructor(
    private readonly googleDriveService: GoogleDriveService,
    private readonly configService: ConfigService,
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
    @InjectRepository(BookFile)
    private readonly bookFileRepository: Repository<BookFile>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(CategoryType)
    private readonly categoryTypeRepository: Repository<CategoryType>,
    @InjectRepository(SyncState)
    private readonly syncStateRepository: Repository<SyncState>,
    private readonly mediaService: MediaService,
    private readonly geminiService: GeminiService,
    private readonly bookFileService: BookFileService,
  ) {}

  async onModuleInit() {
    // Backfill các Book đã có sẵn (chưa có entry trong book_files / chưa có matchKey)
    // → idempotent, an toàn để chạy mỗi lần boot.
    try {
      await this.backfillExistingBooks();
    } catch (err) {
      this.logger.warn(`[DriveSync] Backfill existing books failed: ${err?.message}`);
    }
  }

  // ------------------------------------------------------------------
  // Public API
  // ------------------------------------------------------------------

  @Cron(CronExpression.EVERY_2_HOURS)
  async scheduledSync() {
    const enabled = this.configService.get<string>('GOOGLE_DRIVE_SYNC_ENABLED');
    if (enabled !== 'true') return;
    await this.syncFromDrive();
  }

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
      const state = await this.getOrCreateSyncState();
      const since = options?.force ? undefined : state.lastSyncAt ?? undefined;

      this.logger.log(
        `[DriveSync] Starting sync from folder=${folderId} (since=${since?.toISOString() ?? 'ALL'})`,
      );
      const files = await this.googleDriveService.listEbooks(folderId, since);
      this.logger.log(`[DriveSync] Discovered ${files.length} file(s)`);

      // Lọc bỏ những file đã đồng bộ trước đó (theo googleDriveFileId).
      const incomingIds = files.map((f) => f.id);
      const existingFiles = incomingIds.length
        ? await this.bookFileRepository.find({
            where: { googleDriveFileId: In(incomingIds) },
          })
        : [];
      const existingDriveIds = new Set(existingFiles.map((bf) => bf.googleDriveFileId));

      const freshFiles = files.filter((f) => !existingDriveIds.has(f.id));
      result.skipped += files.length - freshFiles.length;
      if (files.length !== freshFiles.length) {
        result.details.push(
          `[INFO] ${files.length - freshFiles.length} file(s) đã đồng bộ trước đó → bỏ qua`,
        );
      }

      // --- B1: Extract metadata song song (giới hạn concurrency) ---
      const processed = await this.extractAllMetadata(freshFiles);

      // --- B2: Group theo matchKey để gom các định dạng của cùng 1 sách ---
      const groups = this.groupByMatchKey(processed);

      // --- B3: Resolve common fields (admin, status) ---
      const pendingStatus = await this.categoryRepository.findOne({
        where: { code: CategoryCodeEnum.BOOK_STATUS_PENDING },
      });
      const superAdmin = await this.userRepository.findOne({
        where: { roles: { code: RoleEnum.SUPPER_ADMIN } },
        relations: ['roles'],
      });
      const adminId = superAdmin?.id || 3;

      // --- B4: Với mỗi nhóm, tìm Book sẵn có (theo matchKey) hoặc tạo mới + thêm các BookFile ---
      for (const [matchKey, items] of groups.entries()) {
        try {
          await this.processGroup(matchKey, items, {
            adminId,
            pendingStatusId: pendingStatus?.id,
          });
          result.synced += items.length;
          items.forEach((it) =>
            result.details.push(`[OK] ${it.drive.name} (${it.format}) → ${matchKey}`),
          );
        } catch (err: any) {
          result.errors += items.length;
          items.forEach((it) =>
            result.details.push(`[ERROR] ${it.drive.name}: ${err?.message}`),
          );
          this.logger.error(`[DriveSync] Group "${matchKey}" failed: ${err?.message}`, err?.stack);
        }
      }

      // --- B5: Persist sync state ---
      await this.persistSyncState({
        success: result.errors === 0,
        totalSynced: result.synced,
        totalErrors: result.errors,
        lastError: null,
      });

      this.logger.log(
        `[DriveSync] Completed. synced=${result.synced} skipped=${result.skipped} errors=${result.errors}`,
      );
    } catch (error: any) {
      this.logger.error(`[DriveSync] Fatal error: ${error.message}`, error.stack);
      result.details.push(`[FATAL] ${error.message}`);
      await this.persistSyncState({
        success: false,
        totalSynced: result.synced,
        totalErrors: result.errors,
        lastError: error.message,
      });
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  async getStatus(): Promise<{ isSyncing: boolean; lastSyncAt: Date | null; lastError: string | null }> {
    const state = await this.syncStateRepository.findOne({ where: { jobName: SYNC_JOB_NAME } });
    return {
      isSyncing: this.isSyncing,
      lastSyncAt: state?.lastSyncAt ?? null,
      lastError: state?.lastError ?? null,
    };
  }

  // ------------------------------------------------------------------
  // Phase 1: metadata extraction (parallel + bounded)
  // ------------------------------------------------------------------

  private async extractAllMetadata(files: DriveFileInfo[]): Promise<ProcessedFile[]> {
    if (!files.length) return [];

    const limit = pLimit(this.metadataConcurrency);

    const tasks = files.map((file) =>
      limit(async () => {
        const format = detectEbookFormat(file.name, file.mimeType);
        const item: ProcessedFile = { drive: file, format, metadata: {} };

        try {
          item.buffer = await this.googleDriveService.downloadFileBuffer(file.id);
          item.metadata = await this.extractMetadataFromBuffer(item.buffer, format, file.name);

          const sample = item.buffer.subarray(0, Math.min(1024 * 1024, item.buffer.length));
          item.hash = lightweightHash(sample, file.size);
        } catch (err: any) {
          this.logger.warn(
            `[DriveSync] Metadata extraction failed for "${file.name}": ${err?.message}`,
          );
        }
        return item;
      }),
    );

    return Promise.all(tasks);
  }

  private async extractMetadataFromBuffer(
    buffer: Buffer,
    format: EbookFormat,
    filename: string,
  ): Promise<ExtractedMetadata> {
    const meta: ExtractedMetadata = {};
    try {
      if (format === EbookFormat.PDF) {
        const pdfData = await (pdf as any)(buffer);
        if (pdfData?.info?.Title?.trim()) meta.title = pdfData.info.Title.trim();
        if (pdfData?.info?.Author?.trim()) meta.author = pdfData.info.Author.trim();
        if (typeof pdfData?.numpages === 'number') meta.totalPages = pdfData.numpages;
      } else if (format === EbookFormat.EPUB) {
        const tempPath = path.join(os.tmpdir(), `sync-${Date.now()}-${Math.random().toString(36).slice(2)}.epub`);
        fs.writeFileSync(tempPath, buffer);
        try {
          const epub = new EPub(tempPath);
          await new Promise<void>((resolve, reject) => {
            epub.on('end', () => resolve());
            epub.on('error', (err) => reject(err));
            epub.parse();
          });
          if (epub.metadata?.title?.trim()) meta.title = epub.metadata.title.trim();
          if (epub.metadata?.creator?.trim()) meta.author = epub.metadata.creator.trim();
        } finally {
          if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        }
      }
    } catch (err: any) {
      this.logger.debug(
        `[DriveSync] Inline metadata parse failed for "${filename}" (${format}): ${err?.message}`,
      );
    }
    return meta;
  }

  // ------------------------------------------------------------------
  // Phase 2: grouping & persisting
  // ------------------------------------------------------------------

  private groupByMatchKey(items: ProcessedFile[]): Map<string, ProcessedFile[]> {
    const groups = new Map<string, ProcessedFile[]>();
    for (const item of items) {
      const title =
        item.metadata.title?.trim() || guessTitleFromFilename(item.drive.name);
      const author =
        item.metadata.author?.trim() || guessAuthorFromFilename(item.drive.name) || '';
      const key = buildMatchKey(title, author);
      const arr = groups.get(key) ?? [];
      arr.push(item);
      groups.set(key, arr);
    }
    return groups;
  }

  private async processGroup(
    matchKey: string,
    items: ProcessedFile[],
    ctx: { adminId: number; pendingStatusId?: number },
  ) {
    // Chọn item "đại diện" (ưu tiên epub → pdf …) để lấy title/author chính thức.
    const representative = items
      .slice()
      .sort((a, b) => this.formatRank(a.format) - this.formatRank(b.format))[0];

    const repTitle =
      representative.metadata.title?.trim() ||
      guessTitleFromFilename(representative.drive.name);
    const repAuthor =
      representative.metadata.author?.trim() ||
      guessAuthorFromFilename(representative.drive.name) ||
      'Unknown';

    // 1. Tìm Book sẵn có theo matchKey
    let book = await this.bookRepository.findOne({ where: { matchKey } });

    // 2. Fallback: nếu DB cũ chưa có matchKey, thử match theo title (legacy)
    if (!book) {
      const legacyByTitle = await this.bookRepository.findOne({
        where: { matchKey: IsNull(), title: repTitle },
      });
      if (legacyByTitle) {
        legacyByTitle.matchKey = matchKey;
        book = await this.bookRepository.save(legacyByTitle);
      }
    }

    // 3. Tạo mới nếu chưa có
    if (!book) {
      const draft: Partial<Book> = {
        title: repTitle,
        author: repAuthor,
        matchKey,
        fileUrl: '',
        fileSize: 0,
        language: 'vi',
        isPublic: false,
        createById: ctx.adminId,
        statusId: ctx.pendingStatusId,
        description: `Đồng bộ từ Google Drive`,
        publishedDate: representative.drive.modifiedTime,
        categoryId: await this.resolveCategory(repTitle),
      };

      // Thumbnail (chỉ tải 1 lần cho cả group)
      const thumbnailLink = items
        .map((it) => it.drive.thumbnailLink)
        .find((t) => !!t);
      if (thumbnailLink) {
        try {
          const thumbBuf = await this.googleDriveService.downloadThumbnail(thumbnailLink);
          if (thumbBuf) {
            const coverMedia = await this.mediaService.uploadFromBuffer(
              thumbBuf,
              `cover-${normalizeText(repTitle) || 'book'}.jpg`,
              'image/jpeg',
              'book-covers',
              ctx.adminId,
            );
            draft.coverImageUrl = coverMedia.url;
          }
        } catch (thumbErr: any) {
          this.logger.warn(
            `[DriveSync] Failed to process thumbnail: ${thumbErr?.message}`,
          );
        }
      }

      book = await this.bookRepository.save(this.bookRepository.create(draft));
    }

    // 4. Insert/upsert từng BookFile cho mỗi định dạng trong nhóm
    for (const item of items) {
      // Dedupe theo hash: nếu file có hash trùng entry khác trong DB → bỏ qua thêm
      let hashDuplicate: BookFile | null = null;
      if (item.hash) {
        hashDuplicate = await this.bookFileRepository.findOne({
          where: { fileHash: item.hash },
        });
      }
      if (hashDuplicate && hashDuplicate.bookId !== book.id) {
        this.logger.warn(
          `[DriveSync] File "${item.drive.name}" trùng hash với BookFile#${hashDuplicate.id} (book=${hashDuplicate.bookId}) → bỏ qua`,
        );
        continue;
      }

      const proxyDownloadUrl = `google-drive/download/${item.drive.id}`;

      // Tạo Media record cho file này
      const media = new Media();
      media.filename = item.drive.name;
      media.originalName = item.drive.name;
      media.mimeType = item.drive.mimeType;
      media.size = item.drive.size;
      media.path = proxyDownloadUrl;
      media.publicRelativePath = proxyDownloadUrl;
      media.url = proxyDownloadUrl;
      media.googleDriveFileId = item.drive.id;
      media.isDeleted = false;
      media.userId = ctx.adminId;
      const savedMedia = await this.mediaRepository.save(media);

      await this.bookFileService.upsertFile({
        bookId: book.id,
        format: item.format,
        mimeType: item.drive.mimeType,
        fileUrl: proxyDownloadUrl,
        fileSize: item.drive.size,
        fileHash: item.hash ?? null,
        source: 'drive',
        googleDriveFileId: item.drive.id,
        mediaId: savedMedia.id,
        totalPages: item.metadata.totalPages ?? null,
      });
    }

    // 5. Refresh primary file + đồng bộ ngược lên Book.fileUrl
    await this.bookFileService.refreshPrimary(book.id);
  }

  private formatRank(format: string): number {
    // EPUB (1) → PDF (2) → MOBI (3) → AZW3 (4) → AZW (5) → FB2 (6) → OTHER (99)
    const order: Record<string, number> = {
      epub: 1,
      pdf: 2,
      mobi: 3,
      azw3: 4,
      azw: 5,
      fb2: 6,
    };
    return order[format] ?? 99;
  }

  // ------------------------------------------------------------------
  // Sync state persistence
  // ------------------------------------------------------------------

  private async getOrCreateSyncState(): Promise<SyncState> {
    let state = await this.syncStateRepository.findOne({ where: { jobName: SYNC_JOB_NAME } });
    if (!state) {
      state = this.syncStateRepository.create({
        jobName: SYNC_JOB_NAME,
        lastSyncAt: null,
        totalSynced: 0,
        totalErrors: 0,
      });
      state = await this.syncStateRepository.save(state);
    }
    return state;
  }

  private async persistSyncState(input: {
    success: boolean;
    totalSynced: number;
    totalErrors: number;
    lastError: string | null;
  }) {
    const state = await this.getOrCreateSyncState();
    // Chỉ advance `lastSyncAt` khi không có fatal error – tránh bỏ sót file ở lần sau.
    if (input.success) {
      state.lastSyncAt = new Date();
    }
    state.totalSynced += input.totalSynced;
    state.totalErrors += input.totalErrors;
    state.lastError = input.lastError;
    await this.syncStateRepository.save(state);
  }

  // ------------------------------------------------------------------
  // Backfill Book → BookFile cho dữ liệu legacy
  // ------------------------------------------------------------------

  /**
   * Với mỗi Book đã có `fileUrl` nhưng chưa có entry trong `book_files`,
   * tạo BookFile tương ứng và set primary. Idempotent (chạy nhiều lần OK).
   */
  private async backfillExistingBooks(): Promise<void> {
    const qb = this.bookRepository
      .createQueryBuilder('book')
      .leftJoin(BookFile, 'bf', 'bf.book_id = book.id')
      .where('book.file_url IS NOT NULL AND book.file_url <> :empty', { empty: '' })
      .andWhere('bf.id IS NULL')
      .limit(500);

    const orphanBooks = await qb.getMany();
    if (!orphanBooks.length) return;

    this.logger.log(`[DriveSync] Backfilling ${orphanBooks.length} legacy book(s) → book_files`);

    for (const book of orphanBooks) {
      try {
        const filename = book.fileUrl?.split('/').pop() || book.title || 'book';
        const format = detectEbookFormat(filename, null);

        await this.bookFileService.upsertFile({
          bookId: book.id,
          format,
          mimeType: null,
          fileUrl: book.fileUrl,
          fileSize: Number(book.fileSize ?? 0),
          source: book.fileUrl?.startsWith('google-drive/') ? 'drive' : 'upload',
          totalPages: (book as any).totalPages ?? null,
        });
        await this.bookFileService.refreshPrimary(book.id);

        if (!book.matchKey) {
          book.matchKey = buildMatchKey(book.title, book.author);
          await this.bookRepository.save(book);
        }
      } catch (err: any) {
        this.logger.warn(`[DriveSync] Backfill failed for book#${book.id}: ${err?.message}`);
      }
    }
  }

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------

  private async resolveCategory(bookTitle: string): Promise<number | undefined> {
    try {
      const categoryType = await this.categoryTypeRepository.findOne({
        where: { name: CategoryTypeEnum.BOOK_CATEGORY },
      });
      const bookCategories = await this.categoryRepository.find({
        where: { isActive: true, categoryTypeId: categoryType?.id },
        select: ['id', 'name', 'code'],
      });
      const existingForGemini = bookCategories.map((c) => ({ name: c.name, code: c.code }));

      const classified = await this.geminiService.classifyBookCategory(bookTitle, existingForGemini);

      if (!classified.isNew) {
        const matched = bookCategories.find(
          (c) => c.name.toLowerCase() === classified.categoryName.toLowerCase(),
        );
        if (matched) return matched.id;
      }

      const slug = classified.categoryNameEn
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');
      const newCode = `BOOK_CATEGORY_${slug.toUpperCase()}`;

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
    } catch (error: any) {
      this.logger.warn(`[DriveSync] resolveCategory failed for "${bookTitle}": ${error.message}`);
      return undefined;
    }
  }
}

// `pickPrimaryFormat` được re-export gián tiếp để tránh lint "unused import"
// (dùng trong test/debug riêng).
export { pickPrimaryFormat };
