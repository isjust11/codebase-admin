import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { NOTIFICATION_ROOMS } from '../constants/notification.constants';
import { NotificationData } from '../interfaces/notification.interface';

@Injectable()
export class RoomPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata): NotificationData {
    // Validate và transform dữ liệu
    if (!value.room || !Object.values(NOTIFICATION_ROOMS).includes(value.room)) {
      throw new Error('Invalid room');
    }

    return {
      ...value,
      room: value.room,
    };
  }
} 