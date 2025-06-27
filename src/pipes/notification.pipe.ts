import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { NotificationData } from '../interfaces/notification.interface';
import { NotificationStatus, NotificationType, NotificationPriority } from '../enums/notification.enum';

@Injectable()
export class NotificationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata): NotificationData {
    // Validate và transform dữ liệu
    if (!value.orderId || !value.userId || !value.userName) {
      throw new Error('Missing required fields');
    }

    return {
      ...value,
      timestamp: new Date(),
      status: value.status || NotificationStatus.PENDING,
      type: value.type || NotificationType.ORDER,
      priority: value.priority || NotificationPriority.MEDIUM,
    };
  }
} 