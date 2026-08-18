import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Transform } from 'class-transformer';
import { User } from './user.entity';
import { Category } from './category.entity';
import { TemplateType } from '../enums/template-type.enum';
import { TemplateStatus } from '../enums/template-status.enum';
import { TemplateEditorMode } from '../enums/template-editor-mode.enum';

@Entity('templates')
export class Template {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255, unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 32, default: TemplateType.EVENT })
  type: TemplateType;

  @Column({ length: 512, nullable: true })
  thumbnailUrl?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'longtext' })
  htmlContent: string;

  @Column({ type: 'longtext', nullable: true })
  cssContent?: string;

  @Column({ type: 'json', nullable: true })
  variablesSchema?: Record<string, any>[];

  @Column({ type: 'json', nullable: true })
  layoutJson?: Record<string, any>;

  @Column({ type: 'varchar', length: 16, default: TemplateEditorMode.CODE })
  editorMode?: TemplateEditorMode | string;

  @Column({ nullable: true })
  categoryId?: number;

  @ManyToOne(() => Category, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'categoryId' })
  category?: Category;

  @Column({ type: 'varchar', length: 24, default: TemplateStatus.DRAFT })
  status: TemplateStatus;

  @Column({ default: false })
  isPublished: boolean;

  @Column({ type: 'text', nullable: true })
  reviewNote?: string;

  @Column({ type: 'timestamp', nullable: true })
  submittedAt?: Date;

  @Column({ default: false })
  isPremium: boolean;

  @Column({ nullable: true })
  createdById?: number;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdById' })
  createdBy?: User;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @Transform(({ value }) => (value ? new Date(value) : value))
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  @Transform(({ value }) => (value ? new Date(value) : value))
  updatedAt: Date;
}
