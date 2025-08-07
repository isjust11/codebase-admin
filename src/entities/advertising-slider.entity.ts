import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index, Check } from 'typeorm';
import { User } from './user.entity';
import { Transform } from 'class-transformer';

export enum SliderType {
  BANNER = 'BANNER',
  PROMOTION = 'PROMOTION',
  NEW_PRODUCT = 'NEW_PRODUCT',
  FEATURED = 'FEATURED',
  EVENT = 'EVENT',
  CATEGORY = 'CATEGORY'
}

export enum SliderPosition {
  TOP = 'TOP',
  MIDDLE = 'MIDDLE',
  BOTTOM = 'BOTTOM',
  SIDEBAR = 'SIDEBAR',
  FULLSCREEN = 'FULLSCREEN'
}

@Entity()
@Check(`"position" >= 1`)
export class AdvertisingSlider {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  @Index()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  subtitle?: string;

  @Column({ length: 255, nullable: true })
  image?: string;

  @Column({ type: 'simple-array', nullable: true })
  images?: string[];

  @Column({ length: 500, nullable: true })
  link?: string;

  @Column({
    type: 'enum',
    enum: SliderType,
    default: SliderType.BANNER
  })
  @Index()
  type: SliderType;

  @Column({
    type: 'enum',
    enum: SliderPosition,
    default: SliderPosition.TOP
  })
  @Index()
  position: SliderPosition;

  @Column({ default: 1 })
  @Index()
  order: number;

  @Column({ default: true })
  @Index()
  isActive: boolean;

  @Column({ default: false })
  isFeatured: boolean;

  @Column({ default: 0 })
  clickCount: number;

  @Column({ default: 0 })
  viewCount: number;

  @Column({ type: 'timestamp', nullable: true })
  @Transform(({ value }) => value ? new Date(value) : value)
  startDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  @Transform(({ value }) => value ? new Date(value) : value)
  endDate?: Date;

  @Column({ type: 'text', nullable: true })
  targetAudience?: string;

  @Column({ type: 'text', nullable: true })
  conditions?: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  ctr?: number; // Click-through rate

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  conversionRate?: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @ManyToOne(() => User, user => user.id, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdById' })
  createdBy?: User | null;

  @Column({ nullable: true })
  createdById?: string;

  @ManyToOne(() => User, user => user.id, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'updatedById' })
  updatedBy?: User | null;

  @Column({ nullable: true })
  updatedById?: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @Transform(({ value }) => value ? new Date(value) : value)
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  @Transform(({ value }) => value ? new Date(value) : value)
  updatedAt: Date;
} 