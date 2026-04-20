import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { User } from './user.entity';
import { SubscriptionPlan } from './subscription-plan.entity';
import { Payment } from './payment.entity';

/** Trạng thái gói đăng ký / thanh toán gói */
export enum SubscriptionStatus {
  /** Chờ thanh toán */
  PENDING_PAYMENT = 'pending_payment',
  /** Đang hoạt động */
  ACTIVE = 'active',
  /** Hết hạn */
  EXPIRED = 'expired',
  /** Đã hủy */
  CANCELLED = 'cancelled',
  /** Dùng thử */
  TRIAL = 'trial',
  /** Miễn phí */
  FREE = 'free',
  /** Thanh toán thất bại */
  PAYMENT_FAILED = 'payment_failed',
}

@Entity('user_subscriptions')
export class UserSubscription {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.subscriptions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @ManyToOne(() => SubscriptionPlan, (plan) => plan.userSubscriptions, {
    eager: true,
  })
  @JoinColumn({ name: 'planId' })
  plan: SubscriptionPlan;

  @Column()
  planId: number;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.PENDING_PAYMENT,
  })
  status: SubscriptionStatus;

  /** Ngày bắt đầu có hiệu lực */
  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  /** Ngày hết hạn */
  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  /** Thanh toán gắn với đăng ký này (optional) */
  @ManyToOne(() => Payment, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'paymentId' })
  payment: Payment;

  @Column({ nullable: true })
  paymentId: number;

  /** Đã dùng bao nhiêu bytes trong kỳ (có thể reset theo period) */
  @Column({ type: 'bigint', default: '0' })
  storageUsedBytes: string;

  /** Đã dùng bao nhiêu lần TTS trong kỳ */
  @Column({ type: 'int', default: 0 })
  ttsUsedInPeriod: number;

  /** Đã dùng bao nhiêu lần convert trong kỳ */
  @Column({ type: 'int', default: 0 })
  convertUsedInPeriod: number;

  /** Đã dùng bao nhiêu lần download trong kỳ */
  @Column({ type: 'int', default: 0 })
  downloadUsedInPeriod: number;

  /** Đã dùng bao nhiêu lần share trong kỳ */
  @Column({ type: 'int', default: 0 })
  shareUsedInPeriod: number;


  /** Kỳ hiện tại (VD: '2025-02' cho tháng 2/2025) để reset usage */
  @Column({ type: 'varchar', length: 16, nullable: true })
  currentPeriodKey: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
