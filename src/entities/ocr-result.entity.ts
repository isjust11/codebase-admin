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

  /** Danh sách dòng kèm bbox + confidence (JSON). */
  @Column({ type: 'json', nullable: true })
  blocks: OcrLine[] | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
