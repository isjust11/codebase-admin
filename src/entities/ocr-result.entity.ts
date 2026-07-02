import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { OcrLine } from '../queues/ocr-queue.interface';

/**
 * Kết quả OCR của một trang trong job. UNIQUE(job_id, page_number) để upsert
 * idempotent khi worker gửi lại kết quả của cùng một trang.
 */
@Entity('ocr_result')
@Unique('UQ_ocr_result_job_page', ['jobId', 'pageNumber'])
export class OcrResult {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'job_id' })
  @Index('IDX_ocr_result_job_id')
  jobId: number;

  @Column({ name: 'page_number' })
  pageNumber: number;

  @Column({ default: 0 })
  width: number;

  @Column({ default: 0 })
  height: number;

  /** Toàn bộ text của trang (đã ghép) — phục vụ tìm kiếm & TTS. */
  @Column({ type: 'longtext', nullable: true })
  text: string | null;

  /** Danh sách dòng text kèm bbox + confidence (JSON). Ảnh/figure/table + bbox nằm ở bảng `ocr_asset`. */
  @Column({ type: 'json', nullable: true })
  blocks: OcrLine[] | null;

  /**
   * Ảnh raster đầy đủ của trang (đúng pixel space đã dùng để OCR/tính bbox).
   * Client hiển thị ảnh này thay vì tự render lại PDF để bbox luôn khớp
   * chính xác 1:1, tránh lệch do khác engine render (PyMuPDF vs pdfium).
   */
  @Column({ name: 'page_image_url', type: 'text', nullable: true })
  pageImageUrl: string | null;

  @Column({ name: 'page_image_key', type: 'varchar', length: 512, nullable: true })
  pageImageKey: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
