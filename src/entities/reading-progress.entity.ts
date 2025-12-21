import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Book } from './book.entity';

@Entity('reading_progress')
export class ReadingProgress {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'book_id' })
  bookId: number;

  @ManyToOne(() => User, (user) => user.readingProgress, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Book, (book) => book.readingProgress, { eager: true })
  @JoinColumn({ name: 'book_id' })
  book: Book;

  @Column({ name: 'current_page', default: 0 })
  currentPage: number;

  @Column({ name: 'last_read_at', type: 'datetime', nullable: true })
  lastReadAt: Date;

  @Column({ name: 'is_finished', default: false })
  isFinished: boolean;

  @Column({ name: 'reading_time_minutes', default: 0 })
  readingTimeMinutes: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

