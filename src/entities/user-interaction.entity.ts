import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity';
import { Article } from './article.entity';
import { Transform } from 'class-transformer';
import { Book } from './book.entity';
import { Category } from './category.entity';

@Entity()
@Index(['userId', 'targetType', 'targetId', 'interactionType'], { unique: true })
export class UserInteraction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => User, user => user.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;


  @Column()
  targetId: number;

  @Column()
  targetType: string;

  @Column()
  interactionType: string;

  // Optional foreign key relationships based on target type
  @Column({ nullable: true })
  articleId?: number;

  @ManyToOne(() => Article, article => article.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'articleId' })
  article?: Article;

  @Column({ nullable: true })
  bookId?: number;


  @ManyToOne(() => Book, book => book.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bookId' })
  book: Book;

  // Additional data for specific interaction types
  @Column({ type: 'json', nullable: true })
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

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @Transform(({ value }) => value ? new Date(value) : value)
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  @Transform(({ value }) => value ? new Date(value) : value)
  updatedAt: Date;
}
