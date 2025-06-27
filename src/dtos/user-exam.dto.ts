import { IsNumber, IsOptional, IsString, IsDateString, IsBoolean } from 'class-validator';

export class UserExamDto {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsNumber()
  userId: number;

  @IsNumber()
  examId: number;

  @IsOptional()
  @IsDateString()
  startedAt?: Date;

  @IsOptional()
  @IsDateString()
  finishedAt?: Date;

  @IsOptional()
  score?: number;

  @IsOptional()
  @IsString()
  status?: string;

  // Thông tin thanh toán
  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;

  @IsOptional()
  @IsDateString()
  paidAt?: Date;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  transactionId?: string;

  @IsOptional()
  @IsString()
  paymentStatus?: string;

  // Thông tin kích hoạt
  @IsOptional()
  @IsBoolean()
  isActivated?: boolean;

  @IsOptional()
  @IsDateString()
  activatedAt?: Date;
} 