import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany, ManyToMany } from 'typeorm';
import { User } from './user.entity';
import { Category } from './category.entity';
import { Transform } from 'class-transformer';
import { Author } from './author.entity';
import { DataSource } from './data-source.entity';
import { FolkMedicineIngredient } from './folk-medicine-ingredient.entity';
import { Disease } from './disease.entity';
@Entity()
export class FolkMedicine {
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
  ingredients?: string;

  @Column({ type: 'text', nullable: true })
  preparation?: string;

  @Column({ type: 'text', nullable: true })
  usage?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ length: 255, nullable: true })
  thumbnail?: string;

  @Column({ nullable: true })
  authorId?: number;

  @ManyToOne(() => Author, author => author.id, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'authorId' })
  author?: Author | null;

  @ManyToOne(() => Category, category => category.id, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'categoryId' })
  category?: Category | null;

  @Column({ nullable: true })
  categoryId?: number;

  @Column({ nullable: true })
  dataSourceId?: number;

  @ManyToOne(() => DataSource, dataSource => dataSource.id, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'dataSourceId' })
  dataSource?: DataSource | null;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => FolkMedicineIngredient, ing => ing.folkMedicine, { cascade: true })
  ingredientsDetail?: FolkMedicineIngredient[];

  @ManyToMany(() => Disease, disease => disease.folkMedicines)
  diseases?: Disease[];

  // Lưu ý: Quan hệ với HerbalImage được quản lý thông qua entityType và entityId
  // Sử dụng HerbalImageService.findByEntity(ImageEntityType.FOLK_MEDICINE, this.id) để lấy hình ảnh

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @Transform(({ value }) => value ? new Date(value) : value)
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  @Transform(({ value }) => value ? new Date(value) : value)
  updatedAt: Date;
} 