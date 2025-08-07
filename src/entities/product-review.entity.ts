import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index, Check } from 'typeorm';
import { User } from './user.entity';
import { Product } from './product.entity';
import { Transform } from 'class-transformer';

@Entity()
@Check(`"rating" >= 1 AND "rating" <= 5`)
export class ProductReview {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', default: 5 })
  @Index()
  rating: number;

  @Column({ type: 'text', nullable: true })
  title?: string;

  @Column({ type: 'text', nullable: true })
  comment?: string;

  @Column({ type: 'simple-array', nullable: true })
  images?: string[];

  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: false })
  isHelpful: boolean;

  @Column({ default: 0 })
  helpfulCount: number;

  @Column({ default: false })
  isAnonymous: boolean;

  @ManyToOne(() => User, user => user.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Product, product => product.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column()
  productId: number;

  @ManyToOne(() => User, user => user.id, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'repliedById' })
  repliedBy?: User | null;

  @Column({ nullable: true })
  repliedById?: string;

  @Column({ type: 'text', nullable: true })
  reply?: string;

  @Column({ type: 'timestamp', nullable: true })
  @Transform(({ value }) => value ? new Date(value) : value)
  repliedAt?: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @Transform(({ value }) => value ? new Date(value) : value)
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  @Transform(({ value }) => value ? new Date(value) : value)
  updatedAt: Date;
} 