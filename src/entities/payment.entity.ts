import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { UserSubscription } from './user-subscription.entity';
import { SubscriptionPlan } from './subscription-plan.entity';

export enum PaymentStatus {
    PENDING = 'pending',
    COMPLETED = 'completed',
    FAILED = 'failed',
    REFUNDED = 'refunded',
    CANCELLED = 'cancelled'
}

export enum PaymentMethod {
    STRIPE = 'stripe',
    VNPAY = 'vnpay',
    MOMO = 'momo',
    ZALOPAY = 'zalopay',
    PAYOS = 'payos',
    CASH = 'cash',
    REVENUECAT = 'revenuecat'
}

@Entity()
export class Payment {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, user => user.id)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    userId: number;

    @ManyToOne(() => SubscriptionPlan, { nullable: true })
    @JoinColumn({ name: 'planId' })
    plan: SubscriptionPlan;

    @Column({ nullable: true })
    planId: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @Column({ type: 'varchar', length: 3, default: 'VND' })
    currency: string;

    @Column({
        type: 'enum',
        enum: PaymentMethod,
        default: PaymentMethod.STRIPE
    })
    paymentMethod: PaymentMethod;

    @Column({
        type: 'enum',
        enum: PaymentStatus,
        default: PaymentStatus.PENDING
    })
    status: PaymentStatus;

    @Column({ nullable: true })
    transactionId: string;

    @Column({ nullable: true })
    paymentIntentId: string; // Stripe Payment Intent ID

    @Column({ nullable: true })
    gatewayTransactionId: string; // Transaction ID từ payment gateway (VNPay, MoMo, etc.)

    @Column({ nullable: true, type: 'text' })
    paymentUrl: string; // URL để redirect user đến trang thanh toán

    @Column({ nullable: true })
    ipAddress: string; // IP của user khi tạo payment

    @Column({ nullable: true })
    gatewayResponse: string; // JSON response from payment gateway

    @Column({ nullable: true })
    paidAt: Date; // Thời điểm thanh toán thành công

    @Column({ nullable: true })
    description: string;

    @Column({ nullable: true })
    metadata: string; // JSON metadata

    @Column({ nullable: true })
    failureReason: string;

    @Column({ nullable: true })
    periodMonths: number;

    @Column({ nullable: true })
    discountPercentage: number;

    /** Gắn với đăng ký gói (nếu thanh toán là mua gói) */
    @ManyToOne(() => UserSubscription, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'userSubscriptionId' })
    userSubscription: UserSubscription;

    @Column({ nullable: true })
    userSubscriptionId: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({ nullable: true })
    completedAt: Date;
} 