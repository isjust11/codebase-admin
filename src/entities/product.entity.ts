import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany, Index, Check } from 'typeorm';
import { Category } from './category.entity';
import { User } from './user.entity';
import { Transform } from 'class-transformer';

@Entity()
@Check(`"price" >= 0`)
@Check(`"stock" >= 0`)
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  @Index()
  name: string;

  @Column({ length: 255, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  shortDescription?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  originalPrice?: number;

  @Column({ default: 0 })
  stock: number;

  @Column({ length: 255, nullable: true })
  sku?: string;

  @Column({ length: 255, nullable: true })
  barcode?: string;

  @Column({ length: 255, nullable: true })
  brand?: string;

  @Column({ length: 255, nullable: true })
  model?: string;

  @Column({ type: 'text', nullable: true })
  specifications?: string;

  @Column({ type: 'text', nullable: true })
  features?: string;

  @Column({ type: 'text', nullable: true })
  warranty?: string;

  @Column({ length: 255, nullable: true })
  mainImage?: string;

  @Column({ type: 'simple-array', nullable: true })
  images?: string[];

  @Column({ default: true })
  @Index()
  isActive: boolean;

  @Column({ default: false })
  isFeatured: boolean;

  @Column({ default: 0 })
  viewCount: number;

  @Column({ default: 0 })
  soldCount: number;

  @Column({ default: 0 })
  rating: number;

  @Column({ default: 0 })
  reviewCount: number;

  @Column({ nullable: true })
  weight?: number;

  @Column({ nullable: true })
  length?: number;

  @Column({ nullable: true })
  width?: number;

  @Column({ nullable: true })
  height?: number;

  @ManyToOne(() => Category, category => category.id, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'categoryId' })
  category?: Category | null;

  @Column({ nullable: true })
  categoryId?: string;

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