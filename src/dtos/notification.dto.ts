import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { NotificationStatus, NotificationType, NotificationPriority } from '../enums/notification.enum';

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  userName: string;

  @IsOptional()
  @IsString()
  status?: NotificationStatus;

  @IsOptional()
  @IsString()
  type?: NotificationType;

  @IsOptional()
  @IsString()
  priority?: NotificationPriority;

  @IsOptional()
  additionalData?: any;
}

export class JoinRoomDto {
  @IsString()
  @IsNotEmpty()
  room: string;

  @IsString()
  @IsNotEmpty()
  role: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  userName: string;
}

export class LeaveRoomDto {
  @IsString()
  @IsNotEmpty()
  room: string;
} 