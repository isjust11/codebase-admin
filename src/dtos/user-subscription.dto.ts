import { IsNumber, IsOptional, IsEnum } from 'class-validator';
import { SubscriptionStatus } from '../entities/user-subscription.entity';

export class CreateUserSubscriptionDto {
  @IsNumber()
  planId: number;

  /** Nếu truyền status = trial có thể tạo gói dùng thử không cần thanh toán */
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;

  @IsOptional()
  @IsNumber()
  periodMonths?: number;
}

export class UpdateUserSubscriptionDto {
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;

  @IsOptional()
  @IsNumber()
  paymentId?: number;
}

export class IncrementUsageDto {
  /** Bytes tăng thêm cho storage */
  @IsOptional()
  @IsNumber()
  storageBytes?: number;

  @IsOptional()
  @IsNumber()
  ttsCount?: number;

  @IsOptional()
  @IsNumber()
  convertCount?: number;

  @IsOptional()
  @IsNumber()
  downloadCount?: number;

  @IsOptional()
  @IsNumber()
  shareCount?: number;
}
