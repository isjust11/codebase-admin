import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';

import { Category } from './category.entity';
import { ReadingProgress } from './reading-progress.entity';

@Entity('books')
export class Book {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  title: string;

  @Column({ nullable: false })
  author: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'cover_image_url', nullable: true })
  coverImageUrl: string;

  @Column({ name: 'file_url', nullable: false })
  fileUrl: string;

  @Column({ name: 'total_pages', nullable: true })
  totalPages: number;

  @Column({ nullable: true })
  isbn: string;

  @Column({ nullable: true })
  publisher: string;

  @Column({ name: 'published_date', type: 'datetime', nullable: true })
  publishedDate: Date;

  @Column({ default: 'vi' })
  language: string;

  @Column({ name: 'is_public', default: true })
  isPublic: boolean;

  @Column({ name: 'category_id', nullable: true })
  categoryId: number;

  @ManyToOne(() => Category, (category) => category.books, { eager: true })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;ß

  @OneToMany(() => ReadingProgress, (progress) => progress.book)
  readingProgress: ReadingProgress[];
}

