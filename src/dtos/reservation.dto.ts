import { IsDate, IsNotEmpty, IsNumber, IsOptional, IsString, IsBoolean } from 'class-validator';

export class CreateReservationDto {
  @IsDate()
  @IsNotEmpty()
  reservationDate: Date;

  @IsString()
  @IsNotEmpty()
  reservationTime: string;

  @IsNumber()
  @IsNotEmpty()
  partySize: number;

  @IsString()
  @IsOptional()
  requestNote?: string;

  @IsNumber()
  @IsNotEmpty()
  tableId: number;

  @IsNumber()
  @IsNotEmpty()
  userId: number;
}

export class UpdateReservationDto {
  @IsDate()
  @IsOptional()
  reservationDate?: Date;

  @IsString()
  @IsOptional()
  reservationTime?: string;

  @IsNumber()
  @IsOptional()
  partySize?: number;

  @IsString()
  @IsOptional()
  requestNote?: string;

  @IsNumber()
  @IsOptional()
  tableId?: number;

  @IsString()
  @IsOptional()
  statusId?: string;

  @IsBoolean()
  @IsOptional()
  isConfirmed?: boolean;
}

export class ConfirmReservationDto {
  @IsNumber()
  @IsNotEmpty()
  confirmedBy: number;
} 