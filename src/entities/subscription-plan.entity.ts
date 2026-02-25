import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserSubscription } from './user-subscription.entity';
import { SubscriptionPlanEnum } from 'src/enums/subscription-plan.enum';


@Entity('subscription_plans')
export class SubscriptionPlan {
  @PrimaryGeneratedColumn()
  id: number;

  /** Mã gói (basic | advanced | ultra) */
  @Column({ type: 'enum', enum: SubscriptionPlanEnum, unique: true })
  code: SubscriptionPlanEnum;

  /** Tên hiển thị */
  @Column({ type: 'varchar', length: 128 })
  name: string;

  /** Mô tả ngắn */
  @Column({ type: 'text', nullable: true })
  description: string;

  /** Dung lượng lưu trữ (bytes). VD: 1GB = 1_073_741_824 */
  @Column({ type: 'bigint', default: 0 })
  storageLimitBytes: string;

  /** Số lần TTS cho phép mỗi kỳ (tháng hoặc theo chu kỳ gói) */
  @Column({ type: 'int', default: 0 })
  ttsLimitPerPeriod: number;

  /** Số lần convert (Word->PDF) cho phép mỗi kỳ */
  @Column({ type: 'int', default: 0 })
  convertLimitPerPeriod: number;

  /** Chu kỳ tính limit: 'month' | 'year' */
  @Column({ type: 'varchar', length: 16, default: 'month' })
  periodType: string;

  /** Giá (VND) - nullable nếu gói free */
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  price: number;

  /** Thứ tự hiển thị (số càng nhỏ càng cao cấp hoặc ngược lại tùy UI) */
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  /** Đang bật bán hay ẩn */
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => UserSubscription, (sub) => sub.plan)
  userSubscriptions: UserSubscription[];
}
