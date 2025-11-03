import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Transform } from 'class-transformer';
import { FolkMedicine } from './folk-medicine.entity';

export enum DataSourceType {
  WEBSITE = 'website',
  EBOOK = 'ebook',
  BOOK = 'book',
  JOURNAL = 'journal',
  RESEARCH_PAPER = 'research_paper',
  INTERVIEW = 'interview',
  DOCUMENT = 'document',
  OTHER = 'other'
}

@Entity()
export class DataSource {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255, nullable: true })
  title?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ 
    type: 'enum', 
    enum: DataSourceType,
    default: DataSourceType.OTHER 
  })
  type: DataSourceType;

  @Column({ length: 500, nullable: true })
  url?: string;

  @Column({ length: 255, nullable: true })
  author?: string;

  @Column({ length: 255, nullable: true })
  publisher?: string;

  @Column({ type: 'date', nullable: true, default: null })
  @Transform(({ value }) => {
    if (value === null || value === undefined || value === '') return null;
    return value instanceof Date ? value : new Date(value);
  })
  publishDate?: Date;

  @Column({ length: 255, nullable: true })
  isbn?: string;

  @Column({ length: 255, nullable: true })
  doi?: string;

  @Column({ length: 500, nullable: true })
  citation?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @Transform(({ value }) => value ? new Date(value) : value)
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  @Transform(({ value }) => value ? new Date(value) : value)
  updatedAt: Date;

  // Quan hệ với FolkMedicine (một nguồn có thể được sử dụng cho nhiều bài thuốc)
  @OneToMany(() => FolkMedicine, folkMedicine => folkMedicine.dataSource)
  folkMedicines?: FolkMedicine[];
}
