export const CHAT_NAMESPACE = '/chat';

export const CHAT_EVENTS = {
  MESSAGE_SEND: 'chat.message.send',
  MESSAGE_NEW: 'chat.message.new',
  MESSAGE_ACK: 'chat.message.ack',
  TYPING: 'chat.typing',
  READ: 'chat.read',
  READ_UPDATE: 'chat.read.update',
  PRESENCE: 'chat.presence',
  CONV_UPDATED: 'chat.conv.updated',
  JOIN_CONV: 'chat.conv.join',
  LEAVE_CONV: 'chat.conv.leave',
  ERROR: 'chat.error',
} as const;

export const CHAT_ROOMS = {
  user: (userId: number | string) => `user:${userId}`,
  conv: (conversationId: number | string) => `conv:${conversationId}`,
} as const;

export const CHAT_DEFAULT_APP_ID = 'green_vietnam';

export const CHAT_APP_ID_HEADER = 'x-app-id';

/** Max messages per REST page. */
export const CHAT_MESSAGE_PAGE_SIZE = 50;

/** Soft rate limit: max sends per window per user (in-memory). */
export const CHAT_SEND_RATE_LIMIT = { max: 30, windowMs: 10_000 } as const;
