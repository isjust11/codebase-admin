import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Article } from './article.entity';
import { Herbal } from './herbal.entity';
import { FolkMedicine } from './folk-medicine.entity';
import { Author } from './author.entity';
import { Category } from './category.entity';
import { InteractionTarget } from '../enums/interaction-target.enum';
import { Transform } from 'class-transformer';

@Entity()
@Index(['targetType', 'targetId'], { unique: true })
export class InteractionStats {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: InteractionTarget
  })
  targetType: InteractionTarget;

  @Column()
  targetId: number;

  // Optional foreign key relationships based on target type
  @Column({ nullable: true })
  articleId?: number;

  @ManyToOne(() => Article, article => article.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'articleId' })
  article?: Article;

  @Column({ nullable: true })
  herbalId?: number;

  @ManyToOne(() => Herbal, herbal => herbal.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'herbalId' })
  herbal?: Herbal;

  @Column({ nullable: true })
  folkMedicineId?: number;

  @ManyToOne(() => FolkMedicine, folkMedicine => folkMedicine.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'folkMedicineId' })
  folkMedicine?: FolkMedicine;

  @Column({ nullable: true })
  authorId?: number;

  @ManyToOne(() => Author, author => author.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorId' })
  author?: Author;

  @Column({ nullable: true })
  categoryId?: number;

  @ManyToOne(() => Category, category => category.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'categoryId' })
  category?: Category;

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
