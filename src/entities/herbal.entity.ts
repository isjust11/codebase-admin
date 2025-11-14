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
  commonNames?: string;

  @Column({ type: 'text', nullable: true })
  family?: string;

  @Column({ type: 'text', nullable: true })
  partsUsed?: string;

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

  // TẠI SAO KHÔNG DÙNG @OneToMany TRỰC TIẾP?
  // 
  // 1. MultiImage là entity generic (polymorphic) - dùng entityType + entityId
  //    để liên kết với nhiều entity khác nhau (Herbal, FolkMedicine, Disease)
  //
  // 2. TypeORM KHÔNG hỗ trợ polymorphic relations native - không thể dùng
  //    @OneToMany với điều kiện entityType = 'herbal' AND entityId = this.id
  //
  // 3. TypeORM cần foreign key thực sự để tạo relation, nhưng MultiImage.entityId
  //    không phải là foreign key đến Herbal (nó có thể trỏ đến entity khác)
  //
  // GIẢI PHÁP:
  // - Dùng Service (KHUYẾN NGHỊ): 
  //   await herbalImageService.findByEntity(ImageEntityType.HERBAL, this.id)
  //
  // - Hoặc query thủ công:
  //   const images = await multiImageRepo.find({
  //     where: { entityType: ImageEntityType.HERBAL, entityId: this.id }
  //   });
  
  @Column({ default: 0 })
  viewCount: number;

  @Column({ default: 0 })
  likeCount: number;

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