import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Book } from './book.entity';

/**
 * Định dạng file ebook chuẩn hóa.
 * Lưu ý: KHÔNG hardcode toàn bộ ở DB level (giữ kiểu `string` để mở rộng),
 * nhưng dùng enum trong code để type-safe.
 */
export enum EbookFormat {
  PDF = 'pdf',
  EPUB = 'epub',
  MOBI = 'mobi',
  AZW = 'azw',
  AZW3 = 'azw3',
  FB2 = 'fb2',
  OTHER = 'other',
}

/**
 * Một bản ebook có thể có nhiều file định dạng khác nhau (pdf, epub, mobi…).
 * Mỗi định dạng = 1 BookFile riêng, gắn vào cùng một Book.
 *
 * UNIQUE (book_id, format) → mỗi sách chỉ có duy nhất 1 file cho mỗi định dạng.
 * UNIQUE (google_drive_file_id) → chống trùng khi sync incremental.
 */
@Entity('book_files')
@Unique('UQ_book_files_book_format', ['bookId', 'format'])
export class BookFile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'book_id' })
  @Index('IDX_book_files_book_id')
  bookId: number;

  @ManyToOne(() => Book, (book) => book.files, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'book_id' })
  book: Book;

  /** 'pdf' | 'epub' | 'mobi' | 'azw' | 'azw3' | 'fb2' | 'other' */
  @Column({ length: 16 })
  @Index('IDX_book_files_format')
  format: string;

  @Column({ name: 'mime_type', length: 128, nullable: true })
  mimeType: string;

  @Column({ name: 'file_url', type: 'text' })
  fileUrl: string;

  @Column({ name: 'file_size', type: 'bigint', default: 0 })
  fileSize: number;

  /**
   * Hash sampling (sha1 của 1MB đầu + filesize) → đủ để phát hiện trùng nội dung
   * mà không phải tải full file.
   */
  @Column({ name: 'file_hash', length: 64, nullable: true })
  @Index('IDX_book_files_hash')
  fileHash: string;

  /** 'upload' | 'drive' | 'external_url' | 'admin_seed' */
  @Column({ length: 32, default: 'upload' })
  source: string;

  @Column({ name: 'google_drive_file_id', length: 128, nullable: true })
  @Index('IDX_book_files_drive_id', { unique: true, where: 'google_drive_file_id IS NOT NULL' })
  googleDriveFileId: string;

  @Column({ name: 'media_id', nullable: true })
  mediaId: number;

  /** File mặc định mở khi user vào chi tiết sách (mỗi book có đúng 1 primary). */
  @Column({ name: 'is_primary', default: false })
  @Index('IDX_book_files_primary')
  isPrimary: boolean;

  /** Số trang riêng theo từng định dạng (PDF có thể khác EPUB do reflow). */
  @Column({ name: 'total_pages', nullable: true })
  totalPages: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
