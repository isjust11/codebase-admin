import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Book } from '../entities/book.entity';
import { BookFile, EbookFormat } from '../entities/book-file.entity';
import { formatPriority, pickPrimaryFormat } from '../utils/ebook-format.util';

export interface UpsertBookFileInput {
  bookId: number;
  format: string;
  mimeType?: string | null;
  fileUrl: string;
  fileSize?: number;
  fileHash?: string | null;
  source?: string;
  googleDriveFileId?: string | null;
  mediaId?: number | null;
  totalPages?: number | null;
}

@Injectable()
export class BookFileService {
  private readonly logger = new Logger(BookFileService.name);

  constructor(
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
    @InjectRepository(BookFile)
    private readonly bookFileRepository: Repository<BookFile>,
  ) {}

  /**
   * Thêm hoặc cập nhật 1 file của Book.
   * UNIQUE(book_id, format) đảm bảo mỗi sách chỉ có 1 file cho mỗi định dạng.
   */
  async upsertFile(input: UpsertBookFileInput): Promise<BookFile> {
    const existing = await this.bookFileRepository.findOne({
      where: { bookId: input.bookId, format: input.format },
    });

    if (existing) {
      Object.assign(existing, {
        mimeType: input.mimeType ?? existing.mimeType,
        fileUrl: input.fileUrl,
        fileSize: input.fileSize ?? existing.fileSize,
        fileHash: input.fileHash ?? existing.fileHash,
        source: input.source ?? existing.source,
        googleDriveFileId: input.googleDriveFileId ?? existing.googleDriveFileId,
        mediaId: input.mediaId ?? existing.mediaId,
        totalPages: input.totalPages ?? existing.totalPages,
      });
      return this.bookFileRepository.save(existing);
    }

    const bookFile = this.bookFileRepository.create({
      bookId: input.bookId,
      format: input.format,
      mimeType: input.mimeType ?? undefined,
      fileUrl: input.fileUrl,
      fileSize: input.fileSize ?? 0,
      fileHash: input.fileHash ?? undefined,
      source: input.source ?? 'upload',
      googleDriveFileId: input.googleDriveFileId ?? undefined,
      mediaId: input.mediaId ?? undefined,
      totalPages: input.totalPages ?? undefined,
    });
    return this.bookFileRepository.save(bookFile);
  }

  /**
   * Đảm bảo mỗi book có đúng 1 file `isPrimary = true` ở định dạng ưu tiên cao nhất.
   * Đồng thời cập nhật `Book.fileUrl` và `Book.fileSize` để giữ backward-compat với
   * các API/Mobile client cũ chỉ đọc trực tiếp `book.fileUrl`.
   */
  async refreshPrimary(bookId: number): Promise<BookFile | null> {
    const files = await this.bookFileRepository.find({ where: { bookId } });
    if (!files.length) return null;

    const primary = pickPrimaryFormat(files)!;

    // reset all → set 1 primary (chạy 2 query thay vì N save)
    await this.bookFileRepository.update({ bookId }, { isPrimary: false });
    await this.bookFileRepository.update({ id: primary.id }, { isPrimary: true });

    await this.bookRepository.update(
      { id: bookId },
      {
        fileUrl: primary.fileUrl,
        fileSize: primary.fileSize,
        totalPages: primary.totalPages ?? undefined,
      },
    );

    return { ...primary, isPrimary: true };
  }

  /**
   * Tìm file đã tồn tại trong DB theo googleDriveFileId (cho incremental sync).
   */
  async findByDriveFileId(driveFileId: string): Promise<BookFile | null> {
    return this.bookFileRepository.findOne({
      where: { googleDriveFileId: driveFileId },
      relations: ['book'],
    });
  }

  /**
   * Tìm file trùng nội dung (theo hash) – dùng để dedupe khi upload thủ công.
   */
  async findByHash(fileHash: string): Promise<BookFile | null> {
    return this.bookFileRepository.findOne({ where: { fileHash } });
  }

  async listByBook(bookId: number): Promise<BookFile[]> {
    const files = await this.bookFileRepository.find({ where: { bookId } });
    return files.sort((a, b) => formatPriority(a.format) - formatPriority(b.format));
  }

  /**
   * Mặc định khi mới tạo book và chưa có file nào → primary là chính file đó.
   * Helper cho luồng upload thủ công (createBook).
   */
  async createInitialFile(
    bookId: number,
    params: {
      format: EbookFormat;
      mimeType?: string | null;
      fileUrl: string;
      fileSize: number;
      source?: string;
      mediaId?: number | null;
      totalPages?: number | null;
    },
  ): Promise<BookFile> {
    const created = await this.upsertFile({
      bookId,
      format: params.format,
      mimeType: params.mimeType,
      fileUrl: params.fileUrl,
      fileSize: params.fileSize,
      source: params.source ?? 'upload',
      mediaId: params.mediaId ?? null,
      totalPages: params.totalPages ?? null,
    });
    await this.refreshPrimary(bookId);
    return created;
  }
}
