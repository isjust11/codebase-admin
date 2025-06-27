import { SetMetadata } from '@nestjs/common';
import { NOTIFICATION_ROOMS } from '../constants/notification.constants';

type RoomType = typeof NOTIFICATION_ROOMS[keyof typeof NOTIFICATION_ROOMS];

export interface RoomOptions {
  room: RoomType;
  description?: string;
}

export const ROOM_METADATA_KEY = 'room';

export const Room = (options: RoomOptions) => {
  return SetMetadata(ROOM_METADATA_KEY, options);
}; 