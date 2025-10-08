import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity';
import { Article } from './article.entity';
import { Herbal } from './herbal.entity';
import { FolkMedicine } from './folk-medicine.entity';
import { Author } from './author.entity';
import { Category } from './category.entity';
import { InteractionType } from '../enums/interaction-type.enum';
import { InteractionTarget } from '../enums/interaction-target.enum';
import { Transform } from 'class-transformer';

@Entity()
@Index(['userId', 'targetType', 'targetId', 'interactionType'], { unique: true })
export class UserInteraction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => User, user => user.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: InteractionType
  })
  interactionType: InteractionType;

  @Column({
    type: 'enum',
    enum: InteractionTarget
  })
  targetType: InteractionTarget;

  @Column()
  targetId: number;

  // Optional foreign key relationships based on target type
  @Column({ nullable: true })
  articleId?: number;

  @ManyToOne(() => Article, article => article.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'articleId' })
  article?: Article;

  @Column({ nullable: true })
  herbalId?: number;

  @ManyToOne(() => Herbal, herbal => herbal.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'herbalId' })
  herbal?: Herbal;

  @Column({ nullable: true })
  folkMedicineId?: number;

  @ManyToOne(() => FolkMedicine, folkMedicine => folkMedicine.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'folkMedicineId' })
  folkMedicine?: FolkMedicine;

  @Column({ nullable: true })
  authorId?: number;

  @ManyToOne(() => Author, author => author.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorId' })
  author?: Author;

  @Column({ nullable: true })
  categoryId?: number;

  @ManyToOne(() => Category, category => category.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'categoryId' })
  category?: Category;

  // Additional data for specific interaction types
  @Column({ type: 'json', nullable: true })
  metadata?: any;

  // For rating interactions
  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  rating?: number;

  // For comment interactions
  @Column({ type: 'text', nullable: true })
  comment?: string;

  // For share interactions
  @Column({ length: 255, nullable: true })
  sharePlatform?: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @Transform(({ value }) => value ? new Date(value) : value)
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  @Transform(({ value }) => value ? new Date(value) : value)
  updatedAt: Date;
}
