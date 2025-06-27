import { SetMetadata } from '@nestjs/common';
import { NOTIFICATION_EVENTS } from '../constants/notification.constants';

export const EVENT_METADATA = 'event_metadata';

export interface EventMetadata {
  event: typeof NOTIFICATION_EVENTS[keyof typeof NOTIFICATION_EVENTS];
  description: string;
}

export const Event = (metadata: EventMetadata) =>
  SetMetadata(EVENT_METADATA, metadata); 