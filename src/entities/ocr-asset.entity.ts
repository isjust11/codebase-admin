import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { OcrBBox } from '../queues/ocr-queue.interface';

export enum OcrAssetType {
  IMAGE = 'image',
  FIGURE = 'figure',
  TABLE = 'table',
}

/**
 * Ảnh / figure / table được tách ra từ một trang PDF.
 * - source = 'embedded' → ảnh nhúng lấy bằng PyMuPDF.
 * - source = 'layout'   → vùng figure/table phát hiện bằng PP-Structure rồi crop.
 */
@Entity('ocr_asset')
export class OcrAsset {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'job_id' })
  @Index('IDX_ocr_asset_job_id')
  jobId: number;

  @Column({ name: 'page_number' })
  @Index('IDX_ocr_asset_page')
  pageNumber: number;

  /** image | figure | table. */
  @Column({ length: 16, default: OcrAssetType.IMAGE })
  type: string;

  /** Vị trí trong trang (JSON polygon hoặc [x,y,w,h]). */
  @Column({ type: 'json', nullable: true })
  bbox: OcrBBox | null;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl: string | null;

  @Column({ name: 'image_key', type: 'varchar', length: 512, nullable: true })
  imageKey: string | null;

  /** HTML của bảng (chỉ với type = 'table'). */
  @Column({ name: 'table_html', type: 'longtext', nullable: true })
  tableHtml: string | null;

  /** 'embedded' | 'layout'. */
  @Column({ length: 16, default: 'layout' })
  source: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
