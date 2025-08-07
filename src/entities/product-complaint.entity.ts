import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity';
import { Product } from './product.entity';
import { Transform } from 'class-transformer';

export enum ComplaintType {
  QUALITY_ISSUE = 'QUALITY_ISSUE',
  DAMAGED_PRODUCT = 'DAMAGED_PRODUCT',
  WRONG_PRODUCT = 'WRONG_PRODUCT',
  EXPIRED_PRODUCT = 'EXPIRED_PRODUCT',
  MISSING_ITEMS = 'MISSING_ITEMS',
  DELIVERY_ISSUE = 'DELIVERY_ISSUE',
  OTHER = 'OTHER'
}

export enum ComplaintStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  REJECTED = 'REJECTED',
  CLOSED = 'CLOSED'
}

export enum ComplaintPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

@Entity()
export class ProductComplaint {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  @Index()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: ComplaintType,
    default: ComplaintType.OTHER
  })
  @Index()
  type: ComplaintType;

  @Column({
    type: 'enum',
    enum: ComplaintStatus,
    default: ComplaintStatus.PENDING
  })
  @Index()
  status: ComplaintStatus;

  @Column({
    type: 'enum',
    enum: ComplaintPriority,
    default: ComplaintPriority.MEDIUM
  })
  @Index()
  priority: ComplaintPriority;

  @Column({ type: 'simple-array', nullable: true })
  images?: string[];

  @Column({ type: 'simple-array', nullable: true })
  attachments?: string[];

  @Column({ type: 'text', nullable: true })
  adminNotes?: string;

  @Column({ type: 'text', nullable: true })
  resolution?: string;

  @Column({ type: 'timestamp', nullable: true })
  @Transform(({ value }) => value ? new Date(value) : value)
  resolvedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  @Transform(({ value }) => value ? new Date(value) : value)
  closedAt?: Date;

  @Column({ default: false })
  isUrgent: boolean;

  @Column({ default: false })
  isAnonymous: boolean;

  @Column({ length: 255, nullable: true })
  contactPhone?: string;

  @Column({ length: 255, nullable: true })
  contactEmail?: string;

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
  @JoinColumn({ name: 'assignedToId' })
  assignedTo?: User | null;

  @Column({ nullable: true })
  assignedToId?: string;

  @ManyToOne(() => User, user => user.id, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'resolvedById' })
  resolvedBy?: User | null;

  @Column({ nullable: true })
  resolvedById?: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @Transform(({ value }) => value ? new Date(value) : value)
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  @Transform(({ value }) => value ? new Date(value) : value)
  updatedAt: Date;
} 