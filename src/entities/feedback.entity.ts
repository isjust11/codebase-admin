import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

export enum FeedbackStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

export enum FeedbackType {
  BUG_REPORT = 'bug',
  FEATURE_REQUEST = 'feature',
  IMPROVEMENT = 'improvement',
  OTHER = 'other',
  GENERAL = 'general'
}

export enum FeedbackPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

@Entity()
export class Feedback {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text')
  content: string;

  @Column({
    type: 'enum',
    enum: FeedbackType,
    default: FeedbackType.GENERAL,
    nullable: true,
  })
  type: FeedbackType;

  @Column({
    type: 'enum',
    enum: FeedbackStatus,
    default: FeedbackStatus.PENDING,
    nullable: true,
  })
  status: FeedbackStatus;

  @Column({
    type: 'enum',
    enum: FeedbackPriority,
    default: FeedbackPriority.MEDIUM,
    nullable: true,
  })
  priority: FeedbackPriority;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  deviceInfo: string;

  @Column({ nullable: true })
  appVersion: string;

  @Column({ nullable: true })
  osVersion: string;

  @Column({ nullable: true })
  attachments: string; // JSON string of attachment URLs ;

  @Column({ nullable: true })
  adminResponse: string;

  @Column({ nullable: true })
  adminNotes: string;

  @Column({ default: false })
  isPublic: boolean;

  @Column({ default: false })
  isAnonymous: boolean;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  userId: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assignedToId' })
  assignedTo: User;

  @Column({ nullable: true })
  assignedToId: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @Column({ nullable: true })
  resolvedAt: Date;
}
