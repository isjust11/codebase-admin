import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { NOTIFICATION_EVENTS } from '../constants/notification.constants';

export const MESSAGE_METADATA = 'message_metadata';

type NotificationEvent = typeof NOTIFICATION_EVENTS[keyof typeof NOTIFICATION_EVENTS];

export const Message = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const client = ctx.switchToWs().getClient();
    const event = ctx.switchToWs().getPattern() as NotificationEvent;
    const message = ctx.switchToWs().getData();

    if (!event || !Object.values(NOTIFICATION_EVENTS).includes(event)) {
      throw new Error('Invalid event');
    }

    return {
      client,
      event,
      message,
    };
  },
); 