import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/** Trạng thái vòng đời của một job OCR. */
export enum OcrJobStatus {
  QUEUED = 'queued',
  PROCESSING = 'processing',
  DONE = 'done',
  FAILED = 'failed',
}

/**
 * Một yêu cầu OCR cho một file (thường là PDF). Mỗi job sinh ra nhiều
 * `ocr_result` (theo trang) và `ocr_asset` (ảnh/figure/table tách ra).
 */
@Entity('ocr_job')
export class OcrJob {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  @Index('IDX_ocr_job_user_id')
  userId: number;

  @Column({ name: 'file_url', type: 'text' })
  fileUrl: string;

  @Column({ name: 'file_key', type: 'varchar', length: 512, nullable: true })
  fileKey: string | null;

  @Column({ name: 'original_name', type: 'varchar', length: 512, nullable: true })
  originalName: string | null;

  @Column({ name: 'mime_type', type: 'varchar', length: 128, nullable: true })
  mimeType: string | null;

  @Column({ name: 'file_size', type: 'bigint', default: 0 })
  fileSize: number;

  /** 'vi' | 'en' | 'auto'. */
  @Column({ length: 16, default: 'auto' })
  lang: string;

  /** 'text' | 'layout'. */
  @Column({ length: 16, default: 'layout' })
  mode: string;

  @Column({ name: 'extract_images', default: true })
  extractImages: boolean;

  /** queued | processing | done | failed. */
  @Column({ length: 16, default: OcrJobStatus.QUEUED })
  @Index('IDX_ocr_job_status')
  status: string;

  @Column({ name: 'total_pages', type: 'int', nullable: true })
  totalPages: number | null;

  @Column({ name: 'processed_pages', default: 0 })
  processedPages: number;

  @Column({ type: 'text', nullable: true })
  error: string | null;

  /** URL file .txt đã export (ghép text các trang). */
  @Column({ name: 'txt_url', type: 'text', nullable: true })
  txtUrl: string | null;

  /** URL searchable PDF đã export (ảnh gốc + lớp text ẩn). */
  @Column({ name: 'pdf_url', type: 'text', nullable: true })
  pdfUrl: string | null;

  /** Trạng thái export PDF: processing | done | failed. */
  @Column({ name: 'export_status', type: 'varchar', length: 16, nullable: true })
  exportStatus: string | null;

  @Column({ name: 'export_error', type: 'text', nullable: true })
  exportError: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
