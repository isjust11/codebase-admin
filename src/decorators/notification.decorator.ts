import { SetMetadata } from '@nestjs/common';
import { NotificationType, NotificationPriority } from '../enums/notification.enum';

export const NOTIFICATION_METADATA = 'notification_metadata';

export interface NotificationMetadata {
  type: NotificationType;
  priority: NotificationPriority;
}

export const Notification = (metadata: NotificationMetadata) =>
  SetMetadata(NOTIFICATION_METADATA, metadata); 