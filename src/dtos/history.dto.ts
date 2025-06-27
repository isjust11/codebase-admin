import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { HistoryType, HistoryAction } from '../entities/history.entity';

export class CreateHistoryDto {
  @IsEnum(HistoryType)
  type: HistoryType;

  @IsEnum(HistoryAction)
  action: HistoryAction;

  @IsNumber()
  @IsOptional()
  reservationId?: number;

  @IsNumber()
  @IsOptional()
  orderId?: number;

  @IsNumber()
  userId: number;

  @IsOptional()
  oldData?: any;

  @IsOptional()
  newData?: any;

  @IsString()
  @IsOptional()
  description?: string;
}

export class GetHistoryDto {
  @IsEnum(HistoryType)
  @IsOptional()
  type?: HistoryType;

  @IsEnum(HistoryAction)
  @IsOptional()
  action?: HistoryAction;

  @IsNumber()
  @IsOptional()
  userId?: number;

  @IsNumber()
  @IsOptional()
  reservationId?: number;

  @IsNumber()
  @IsOptional()
  orderId?: number;
} 