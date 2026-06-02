import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum SyncLogAction {
  SYNC_DRIVE = 'SYNC_DRIVE',
  SYNC_MISSING_INFO = 'SYNC_MISSING_INFO',
}

export enum SyncLogStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  PARTIAL = 'PARTIAL',
}

@Entity('sync_logs')
export class SyncLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 64 })
  action: string;

  @Column({ type: 'varchar', length: 32 })
  status: string;

  @Column({ type: 'int', default: 0 })
  processed: number;

  @Column({ type: 'int', default: 0 })
  updated: number;

  @Column({ type: 'int', default: 0 })
  errors: number;

  // JSON string or long text to store details/errors
  @Column({ type: 'text', nullable: true })
  details: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
