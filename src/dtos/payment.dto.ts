import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  planId: string;

  @IsEnum(['stripe', 'vnpay', 'momo', 'zalopay', 'payos'])
  paymentMethod: 'stripe' | 'vnpay' | 'momo' | 'zalopay' | 'payos'; // Mở rộng thêm các gateway khác

  @IsString()
  @IsOptional()
  bankCode?: string; // Optional: mã ngân hàng cho VNPay

  @IsNumber()
  @IsOptional()
  periodMonths?: number;

  @IsNumber()
  @IsOptional()
  discountPercentage?: number;
}