import { Entity, Column, PrimaryGeneratedColumn, ManyToMany, JoinTable, ManyToOne, JoinColumn } from 'typeorm';
import { FolkMedicine } from './folk-medicine.entity';
import { Transform } from 'class-transformer';
import { ImageEntityType, MultiImage } from './multi-image.entity';
import { Author } from './author.entity';
import { Category } from './category.entity';
import { DataSource } from './data-source.entity';

@Entity()
export class Disease {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  summary?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  symptoms?: string;

  @Column({ type: 'text', nullable: true })
  causes?: string;

  @Column({ type: 'text', nullable: true })
  prevention?: string;

  @Column({ type: 'text', nullable: true })
  treatment?: string;

  @Column({ length: 255, nullable: true })
  thumbnail?: string;

  @Column({ nullable: true })
  authorId?: number;

  @ManyToOne(() => Author, author => author.id, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'authorId' })
  author?: Author | null;

  @Column({ nullable: true })
  categoryId?: number;

  @ManyToOne(() => Category, category => category.id, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'categoryId' })
  category?: Category | null;

  @Column({ nullable: true })
  dataSourceId?: number;

  @ManyToOne(() => DataSource, dataSource => dataSource.id, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'dataSourceId' })
  dataSource?: DataSource | null;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'varchar', nullable: true })
  videoUrl?: string;

  @ManyToMany(() => FolkMedicine, folkMedicine => folkMedicine.diseases)
  @JoinTable({
    name: 'folk_medicine_diseases',
    joinColumn: {
      name: 'diseaseId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'folkMedicineId',
      referencedColumnName: 'id',
    },
  })
  folkMedicines?: FolkMedicine[];

  // Lưu ý: Quan hệ với HerbalImage được quản lý thông qua entityType và entityId
  // Sử dụng HerbalImageService.findByEntity(ImageEntityType.DISEASE, this.id) để lấy hình ảnh

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @Transform(({ value }) => value ? new Date(value) : value)
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  @Transform(({ value }) => value ? new Date(value) : value)
  updatedAt: Date;
}

