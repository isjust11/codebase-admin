import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { Transform } from 'class-transformer';

export enum HerbalImageType {
  MAIN = 'main',           // Hình ảnh chính
  DETAIL = 'detail',       // Hình ảnh chi tiết
  PART = 'part',           // Hình ảnh bộ phận
  GROWTH = 'growth',       // Hình ảnh quá trình sinh trưởng
  PROCESSING = 'processing', // Hình ảnh quá trình bào chế
  USAGE = 'usage',         // Hình ảnh cách sử dụng
  OTHER = 'other'          // Hình ảnh khác
}

export enum ImageEntityType {
  HERBAL = 'herbal',           // Cây thuốc
  FOLK_MEDICINE = 'folk_medicine', // Bài thuốc
  DISEASE = 'disease'          // Bệnh
}

@Entity()
export class MultiImage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  url: string;

  @Column({ length: 255, nullable: true })
  alt?: string;

  @Column({ length: 500, nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: HerbalImageType,
    default: HerbalImageType.MAIN
  })
  type: HerbalImageType;

  @Column({
    type: 'enum',
    enum: ImageEntityType,
    default: ImageEntityType.HERBAL
  })
  entityType: ImageEntityType;

  @Column()
  entityId: number;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @Transform(({ value }) => value ? new Date(value) : value)
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  @Transform(({ value }) => value ? new Date(value) : value)
  updatedAt: Date;
} 