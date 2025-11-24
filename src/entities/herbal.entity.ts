import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Category } from './category.entity';
import { Transform } from 'class-transformer';
import { Author } from './author.entity';
import { DataSource } from './data-source.entity';

@Entity()
export class Herbal {
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

  @Column({ type: 'text', nullable: true })
  scientificName?: string;

  @Column({ type: 'text', nullable: true })
  partsUsedId?: number;

  @Column({ type: 'text', nullable: true })
  activeCompounds?: string;

  @Column({ type: 'text', nullable: true })
  medicinalProperties?: string;

  @Column({ type: 'text', nullable: true })
  preparationMethods?: string;

  @Column({ type: 'text', nullable: true })
  dosage?: string;

  @Column({ type: 'text', nullable: true })
  contraindications?: string;

  @Column({ type: 'text', nullable: true })
  sideEffects?: string;

  @Column({ length: 255, nullable: true })
  thumbnail?: string;

  @Column({ nullable: true })
  authorId?: number;

  @ManyToOne(() => Author, author => author.id, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'authorId' })
  author?: Author | null;

  @ManyToOne(() => Category, category => category.id, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'partsUsedId' })
  partsUsedCategory?: Category | null;

  @ManyToOne(() => Category, category => category.id, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'categoryId' })
  category?: Category | null;

  @Column({ nullable: true })
  categoryId?: number;

  // bổ sung nguồn dữ liệu
  @Column({ type: 'integer', nullable: true })
  sourceDataId?: number;

  @ManyToOne(() => DataSource, dataSource => dataSource.id)
  @JoinColumn({ name: 'sourceDataId' })
  dataSource?: DataSource;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @Transform(({ value }) => value ? new Date(value) : value)
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  @Transform(({ value }) => value ? new Date(value) : value)
  updatedAt: Date;
} 