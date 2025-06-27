import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Transform } from 'class-transformer';

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

  @ManyToOne(() => User, user => user.id, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'authorId' })
  author?: User | null;

  @Column({ nullable: true })
  authorId?: any;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @Transform(({ value }) => value ? new Date(value) : value)
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  @Transform(({ value }) => value ? new Date(value) : value)
  updatedAt: Date;
} 