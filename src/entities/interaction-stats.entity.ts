import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Transform } from 'class-transformer';
//entity for interaction stats by targetId 
@Entity()
@Index(['targetType', 'targetId'], { unique: true })
export class InteractionStats {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  targetId: number;

  @Column()
  targetType: string;

  // Statistics counters
  @Column({ default: 0 })
  likeCount: number;

  @Column({ default: 0 })
  dislikeCount: number;

  @Column({ default: 0 })
  bookmarkCount: number;

  @Column({ default: 0 })
  shareCount: number;

  @Column({ default: 0 })
  viewCount: number;

  @Column({ default: 0 })
  commentCount: number;

  @Column({ default: 0 })
  rateCount: number;

  @Column({ default: 0 })
  followCount: number;

  @Column({ default: 0 })
  favoriteCount: number;

  @Column({ default: 0 })
  archiveCount: number;

  @Column({ default: 0 })
  ttsCount: number;

  @Column({ default: 0 })
  convertCount: number;

  @Column({ default: 0 })
  downloadCount: number;

  @Column({ default: 0 })
  readCount: number;

  // Average rating (for rate interactions)
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  averageRating: number;

  // Total rating sum (for calculating average)
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalRating: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @Transform(({ value }) => value ? new Date(value) : value)
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  @Transform(({ value }) => value ? new Date(value) : value)
  updatedAt: Date;
}
