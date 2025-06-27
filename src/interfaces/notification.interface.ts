import { NOTIFICATION_EVENTS, NOTIFICATION_ROOMS } from '../constants/notification.constants';
import { NotificationStatus, NotificationType, NotificationPriority } from '../enums/notification.enum';

export interface NotificationData {
  event: typeof NOTIFICATION_EVENTS[keyof typeof NOTIFICATION_EVENTS];
  room: typeof NOTIFICATION_ROOMS[keyof typeof NOTIFICATION_ROOMS];
  message: string;
  timestamp: Date;
  orderId: string;
  userId: string;
  userName: string;
  status: NotificationStatus;
  type: NotificationType;
  priority: NotificationPriority;
  tableStatus?: string;
  additionalData?: any;
  error?: string;
}

export interface JoinRoomData {
  room: string;
  role: string;
  userId: string;
  userName: string;
  status: NotificationStatus;
  type: NotificationType;
  priority: NotificationPriority;
} 