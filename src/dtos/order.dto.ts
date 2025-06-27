import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderItemDto {
  @IsNumber()
  foodItemId: number;

  @IsNumber()
  quantity: number;

  @IsString()
  @IsOptional()
  note?: string;
}

export class CreateOrderDto {
  @IsString()
  tableId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  orderItems: CreateOrderItemDto[];

  @IsString()
  @IsOptional()
  note?: string;

  @IsNumber()
  userId: number;

  @IsString()
  statusId: string; // Assuming statusId is a string, adjust if it's a number or enum

  @IsNumber()
  totalAmount: number;

}

export class UpdateOrderStatusDto {
  @IsEnum(['pending', 'preparing', 'ready', 'served', 'completed', 'cancelled'])
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
} 