import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { NOTIFICATION_EVENTS } from '../constants/notification.constants';
import { NotificationData } from '../interfaces/notification.interface';

@Injectable()
export class EventPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata): NotificationData {
    // Validate và transform dữ liệu
    if (!value.event || !Object.values(NOTIFICATION_EVENTS).includes(value.event)) {
      throw new Error('Invalid event');
    }

    return {
      ...value,
      event: value.event,
    };
  }
} 