import { IsString, IsNumber, IsOptional, IsEnum, IsObject } from 'class-validator';
import { PaymentMethod, PaymentStatus } from '../entities/payment.entity';

export class CreatePaymentDto {
  @IsNumber()
  amount: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class PaymentWebhookDto {
  @IsString()
  type: string;

  @IsObject()
  data: any;
}

export class UpdatePaymentStatusDto {
  @IsEnum(PaymentStatus)
  status: PaymentStatus;

  @IsString()
  @IsOptional()
  transactionId?: string;

  @IsString()
  @IsOptional()
  failureReason?: string;

  @IsObject()
  @IsOptional()
  gatewayResponse?: any;
}

export class PaymentResponseDto {
  id: number;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  paymentIntentId?: string;
  description?: string;
  createdAt: Date;
  clientSecret?: string; // For Stripe
  paymentUrl?: string; // For other gateways
} 