import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Lưu trạng thái của các job đồng bộ định kỳ (Google Drive, …).
 * Tách ra DB để khi restart server vẫn biết đã sync tới đâu (không bị in-memory mất).
 */
@Entity('sync_states')
export class SyncState {
  @PrimaryGeneratedColumn()
  id: number;

  /** Tên job duy nhất (ví dụ: 'google_drive_ebook_sync') */
  @Column({ name: 'job_name', length: 64, unique: true })
  jobName: string;

  /** Mốc thời gian lần sync gần nhất (dùng để filter `modifiedTime > lastSyncAt`) */
  @Column({ name: 'last_sync_at', type: 'datetime', nullable: true })
  lastSyncAt: Date | null;

  @Column({ name: 'total_synced', default: 0 })
  totalSynced: number;

  @Column({ name: 'total_errors', default: 0 })
  totalErrors: number;

  @Column({ name: 'last_error', type: 'text', nullable: true })
  lastError: string | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
