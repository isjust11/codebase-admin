import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Transform } from 'class-transformer';
import { Category } from './category.entity';
import { DataSource } from './data-source.entity';
import { Author } from './author.entity';

@Entity()
export class Article {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  title: string;

  @Column({ length: 255, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  summary?: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ length: 255, nullable: true })
  thumbnail?: string;

  @Column({ nullable: true })
  createdById?: number;

  @ManyToOne(() => User, user => user.id, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdById' })
  createdBy?: User;

  @Column({ nullable: true })
  updatedById?: number;

  @ManyToOne(() => User, user => user.id, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'updatedById' })
  updatedBy?: User;

  @ManyToOne(() => Category, category => category.id)
  @JoinColumn({ name: 'statusId' })
  status?: Category;

  @Column({ nullable: true })
  statusId?: number;

  @Column({ nullable: true })
  categoryId?: number;

  @ManyToOne(() => Category, category => category.id)
  @JoinColumn({ name: 'categoryId' })
  category?: Category;

  @Column({ nullable: true })
  view: number;

  @Column({ nullable: true })
  like: number;

  @Column({ default: true })
  isActive: boolean;
  
  // bổ sung nguồn dữ liệu
  @Column({ type: 'integer', nullable: true })
  dataSourceId?: number;
  
  @ManyToOne(() => DataSource, dataSource => dataSource.id)
  @JoinColumn({ name: 'dataSourceId' })
  dataSource?: DataSource;

  @Column({ nullable: true })
  authorId?: number;

  @ManyToOne(() => Author, author => author.id)
  @JoinColumn({ name: 'authorId' })
  author?: Author;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @Transform(({ value }) => value ? new Date(value) : value)
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  @Transform(({ value }) => value ? new Date(value) : value)
  updatedAt: Date;
} 