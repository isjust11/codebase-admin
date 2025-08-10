import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Category } from './category.entity';
import { Transform } from 'class-transformer';
import { HerbalImage } from './herbal-image.entity';
import { Author } from './author.entity';

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

  @OneToMany(() => HerbalImage, herbalImage => herbalImage.herbal, { cascade: true })
  images?: HerbalImage[];

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
  categoryId?: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @Transform(({ value }) => value ? new Date(value) : value)
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  @Transform(({ value }) => value ? new Date(value) : value)
  updatedAt: Date;
} 