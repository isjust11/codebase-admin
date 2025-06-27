import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { NOTIFICATION_MESSAGES } from '../constants/notification.constants';
import { NotificationData } from '../interfaces/notification.interface';

@Injectable()
export class MessagePipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata): NotificationData {
    // Validate và transform dữ liệu
    if (!value.message || !Object.values(NOTIFICATION_MESSAGES).includes(value.message)) {
      throw new Error('Invalid message');
    }

    return {
      ...value,
      message: value.message,
    };
  }
} 