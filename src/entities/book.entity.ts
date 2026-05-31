import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';

import { Category } from './category.entity';
import { User } from './user.entity';
import { BookFile } from './book-file.entity';

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

  @Column({ name: 'cover_image_url', type: 'text', nullable: true })
  coverImageUrl: string;

  @Column({ name: 'file_url', type: 'text', nullable: false })
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

  @Column({ nullable: true })
  countryCode: string;

  @Column({ nullable: true })
  region: string;

  @Column({ name: 'is_public', default: true })
  isPublic: boolean;

  // Danh mục lá (leaf) mà ebook thuộc về.
  // Vd: với cây "Lập trình > Java", giá trị lưu ở đây là id của "Java".
  // Khi cần lấy danh mục cha ("Lập trình"), join `category.parent` ở service.
  @Column({ name: 'category_id', nullable: true })
  categoryId: number;

  @ManyToOne(() => Category, (category) => category.books, {
    eager: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  // Snapshot danh mục cha (denormalized) → cho phép filter "tất cả sách Lập trình"
  // mà không phải JOIN qua category.parent. Service phải tự đồng bộ trường này
  // khi đổi `categoryId` hoặc khi parent của category bị thay đổi.
  @Column({ name: 'parent_category_id', nullable: true })
  parentCategoryId: number;

  @ManyToOne(() => Category, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'parent_category_id' })
  parentCategory: Category;

  // Trạng thái đăng tải ebook (chờ duyệt 1 | đã duyệt 2 | từ chối 3).
  // Cũng tham chiếu Category nhưng KHÔNG dùng inverse `category.books`
  // để tránh xung đột với quan hệ `category` ở trên.
  @Column({ name: 'status_id', nullable: true })
  statusId: number;

  @ManyToOne(() => Category, {
    eager: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'status_id' })
  status: Category;

  @Column({ name: 'create_by_id', nullable: true })
  createById: number;

  @ManyToOne(() => User, (user) => user.books, { eager: true })
  @JoinColumn({ name: 'create_by_id' })
  createBy: User;

  @Column({ name: 'file_size', type: 'bigint', nullable: true, default: 0 })
  fileSize: number;

  // column is sync backfill 1:done 0:waiting
  @Column({ name: 'sync_status', type: 'tinyint', default: 0 })
  syncStatus: number;

  /**
   * Khóa chuẩn hóa dùng để gom các định dạng khác nhau của cùng một sách
   * khi đồng bộ từ Google Drive (xem `text-normalize.util.ts#buildMatchKey`).
   * Ví dụ: cả "Sapiens.pdf" và "Sapiens - Yuval.epub" cùng cho ra
   * matchKey `"sapiens|yuval"` → gom vào 1 Book.
   */
  @Column({ name: 'match_key', type: 'varchar', length: 255, nullable: true })
  @Index('IDX_books_match_key')
  matchKey: string | null;

  /** Danh sách file vật lý của sách (1 sách – nhiều định dạng). */
  @OneToMany(() => BookFile, (file) => file.book, { cascade: true })
  files: BookFile[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

