import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Transform } from 'class-transformer';
import { Herbal } from './herbal.entity';
import { FolkMedicine } from './folk-medicine.entity';

@Entity()
export class Author {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255, unique: true })
  slug: string;

  @Column({ length: 255, nullable: true })
  alias?: string;

  @Column({ type: 'text', nullable: true })
  biography?: string;

  @Column({ type: 'text', nullable: true })
  career?: string;

  @Column({ type: 'text', nullable: true })
  achievements?: string;

  @Column({ type: 'text', nullable: true })
  contributions?: string;

  @Column({ type: 'text', nullable: true })
  works?: string;

  @Column({ type: 'text', nullable: true })
  philosophy?: string;

  @Column({ type: 'text', nullable: true })
  legacy?: string;

  @Column({ type: 'date', nullable: true })
  birthDate?: Date;

  @Column({ type: 'date', nullable: true })
  deathDate?: Date;

  @Column({ length: 255, nullable: true })
  birthPlace?: string;

  @Column({ length: 255, nullable: true })
  deathPlace?: string;

  @Column({ length: 255, nullable: true })
  era?: string;

  @Column({ length: 255, nullable: true })
  dynasty?: string;

  @Column({ length: 255, nullable: true })
  specialty?: string;

  @Column({ length: 255, nullable: true })
  teacher?: string;

  @Column({ type: 'text', nullable: true })
  students?: string;

  @Column({ length: 255, nullable: true })
  portrait?: string;

  @Column({ length: 255, nullable: true })
  avatar?: string;

  @Column({ length: 255, nullable: true })
  coverImage?: string;

  @Column({ type: 'simple-array', nullable: true })
  galleryImages?: string[];

  @Column({ type: 'text', nullable: true })
  quotes?: string;

  @Column({ type: 'text', nullable: true })
  anecdotes?: string;

  @Column({ type: 'text', nullable: true })
  honors?: string;

  @Column({ type: 'text', nullable: true })
  memorials?: string;

  @Column({ type: 'text', nullable: true })
  references?: string;

  @Column({ default: 0 })
  viewCount: number;

  @Column({ default: 0 })
  likeCount: number;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Herbal, herbal => herbal.authorId)
  herbals?: Herbal[];

  @OneToMany(() => FolkMedicine, folkMedicine => folkMedicine.authorId)
  folkMedicines?: FolkMedicine[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @Transform(({ value }) => value ? new Date(value) : value)
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  @Transform(({ value }) => value ? new Date(value) : value)
  updatedAt: Date;
} 