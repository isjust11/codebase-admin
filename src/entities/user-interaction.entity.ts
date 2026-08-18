import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity';
import { Transform } from 'class-transformer';
import { InteractionType } from '../enums/interaction-type.enum';

@Entity()
@Index(['userId', 'targetType', 'targetId', 'interactionType'], { unique: false })
export class UserInteraction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => User, user => user.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Index()
  @Column()
  targetId: number;

  @Column()
  targetType: string;


  @Column({ type: 'enum', enum: InteractionType, default: InteractionType.VIEW })
  interactionType: InteractionType;

  // Additional data for specific interaction types
  @Column({ type: 'text', nullable: true })
  metadata?: any;

  // For rating interactions
  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  rating?: number;

  // For comment interactions
  @Column({ type: 'text', nullable: true })
  comment?: string;

  // For share interactions
  @Column({ length: 255, nullable: true })
  sharePlatform?: string;

  // 0: unread, 1: read, 2: completed
  @Column({ type: 'int', default: 0 })
  status?: number;

  // cần có thêm các fields đếm cho các thao tác khác như tts, convert, download, read
  @Column({ type: 'int', default: 0 })
  ttsCount?: number;

  @Column({ type: 'int', default: 0 })
  convertCount?: number;

  @Column({ type: 'int', default: 0 })
  downloadCount?: number;

  @Column({ type: 'int', default: 0 })
  readCount?: number;

  @Column({ type: 'int', default: 0 })
  shareCount?: number;

  @Column({ type: 'int', default: 0 })
  storageUsedBytes?: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @Transform(({ value }) => value ? new Date(value) : value)
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  @Transform(({ value }) => value ? new Date(value) : value)
  updatedAt: Date;
}
