import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import {
  CHAT_EVENTS,
  CHAT_NAMESPACE,
  CHAT_ROOMS,
  CHAT_SEND_RATE_LIMIT,
  CHAT_DEFAULT_APP_ID,
} from '../constants/chat.constants';
import { ChatService } from '../services/chat/chat.service';
import { ChatRedisService } from '../services/chat/chat-redis.service';
import {
  JoinConvDto,
  MarkReadDto,
  SendMessageDto,
  TypingDto,
} from '../dtos/chat/chat.dto';
import { JwtPayload } from '../dtos/auth.dto';

type AuthedSocket = Socket & {
  data: {
    userId?: number;
    appId?: string;
  };
};

@WebSocketGateway({
  namespace: CHAT_NAMESPACE,
  cors: {
    origin: process.env.CLIENT_URL || true,
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);
  private readonly sendBuckets = new Map<number, { count: number; resetAt: number }>();

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly chatService: ChatService,
    private readonly redis: ChatRedisService,
  ) {}

  async handleConnection(client: AuthedSocket) {
    try {
      const token =
        (client.handshake.auth?.token as string) ||
        (client.handshake.headers?.authorization as string)?.replace(/^Bearer\s+/i, '');
      if (!token) {
        client.emit(CHAT_EVENTS.ERROR, { message: 'Unauthorized' });
        client.disconnect(true);
        return;
      }
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: process.env.JWT_SECRET || 'AyTUug0rjLJrLF5FJOdyaVdNkaZgugvp',
      });
      const userId = payload.id ?? payload.sub;
      if (!userId) {
        client.disconnect(true);
        return;
      }
      const appId =
        (client.handshake.auth?.appId as string) ||
        (client.handshake.headers?.['x-app-id'] as string) ||
        CHAT_DEFAULT_APP_ID;

      client.data.userId = userId;
      client.data.appId = appId;

      await client.join(CHAT_ROOMS.user(userId));
      const count = await this.redis.incrPresence(userId);
      if (count === 1) {
        this.server.emit(CHAT_EVENTS.PRESENCE, { userId, online: true });
      }
      this.logger.debug(`Chat WS connected user=${userId} socket=${client.id}`);
    } catch (err) {
      this.logger.warn(`Chat WS auth failed: ${(err as Error).message}`);
      client.emit(CHAT_EVENTS.ERROR, { message: 'Unauthorized' });
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: AuthedSocket) {
    const userId = client.data?.userId;
    if (!userId) return;
    const count = await this.redis.decrPresence(userId);
    if (count === 0) {
      this.server.emit(CHAT_EVENTS.PRESENCE, { userId, online: false });
    }
  }

  private rateLimitOk(userId: number): boolean {
    const now = Date.now();
    let bucket = this.sendBuckets.get(userId);
    if (!bucket || now >= bucket.resetAt) {
      bucket = { count: 0, resetAt: now + CHAT_SEND_RATE_LIMIT.windowMs };
      this.sendBuckets.set(userId, bucket);
    }
    bucket.count += 1;
    return bucket.count <= CHAT_SEND_RATE_LIMIT.max;
  }

  @SubscribeMessage(CHAT_EVENTS.JOIN_CONV)
  async onJoinConv(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: JoinConvDto,
  ) {
    const userId = client.data.userId!;
    try {
      await this.chatService.assertMember(body.conversationId, userId);
      await client.join(CHAT_ROOMS.conv(body.conversationId));
      return { ok: true };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  }

  @SubscribeMessage(CHAT_EVENTS.LEAVE_CONV)
  async onLeaveConv(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: JoinConvDto,
  ) {
    await client.leave(CHAT_ROOMS.conv(body.conversationId));
    return { ok: true };
  }

  @SubscribeMessage(CHAT_EVENTS.MESSAGE_SEND)
  async onSend(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: SendMessageDto,
  ) {
    const userId = client.data.userId!;
    if (!this.rateLimitOk(userId)) {
      client.emit(CHAT_EVENTS.ERROR, { message: 'Rate limited', clientMsgId: body.clientMsgId });
      return { ok: false, error: 'Rate limited' };
    }
    try {
      const result = await this.chatService.sendMessage(userId, body);
      client.emit(CHAT_EVENTS.MESSAGE_ACK, {
        clientMsgId: body.clientMsgId,
        message: result.message,
        created: result.created,
      });

      if (result.created) {
        this.server
          .to(CHAT_ROOMS.conv(body.conversationId))
          .emit(CHAT_EVENTS.MESSAGE_NEW, result.message);

        for (const memberId of result.memberUserIds) {
          const unread = await this.redis.getUnread(memberId, body.conversationId);
          this.server.to(CHAT_ROOMS.user(memberId)).emit(CHAT_EVENTS.CONV_UPDATED, {
            conversationId: body.conversationId,
            lastMessage: result.message,
            unreadCount: memberId === userId ? 0 : unread,
          });
        }
      }
      return { ok: true, message: result.message };
    } catch (err) {
      client.emit(CHAT_EVENTS.ERROR, {
        message: (err as Error).message,
        clientMsgId: body?.clientMsgId,
      });
      return { ok: false, error: (err as Error).message };
    }
  }

  @SubscribeMessage(CHAT_EVENTS.TYPING)
  async onTyping(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: TypingDto,
  ) {
    const userId = client.data.userId!;
    try {
      await this.chatService.assertMember(body.conversationId, userId);
      client.to(CHAT_ROOMS.conv(body.conversationId)).emit(CHAT_EVENTS.TYPING, {
        conversationId: body.conversationId,
        userId,
        isTyping: body.isTyping !== false,
      });
      return { ok: true };
    } catch {
      return { ok: false };
    }
  }

  @SubscribeMessage(CHAT_EVENTS.READ)
  async onRead(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: MarkReadDto & { conversationId: number },
  ) {
    const userId = client.data.userId!;
    try {
      const result = await this.chatService.markRead(body.conversationId, userId, {
        lastReadMessageId: body.lastReadMessageId,
      });
      this.server
        .to(CHAT_ROOMS.conv(body.conversationId))
        .emit(CHAT_EVENTS.READ_UPDATE, result);
      this.server.to(CHAT_ROOMS.user(userId)).emit(CHAT_EVENTS.CONV_UPDATED, {
        conversationId: body.conversationId,
        unreadCount: 0,
        lastReadMessageId: body.lastReadMessageId,
      });
      return { ok: true, ...result };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  }

  /** Called by REST path when message sent via HTTP instead of WS. */
  async emitMessageNew(message: unknown, conversationId: number, memberUserIds: number[]) {
    if (!this.server) return;
    this.server.to(CHAT_ROOMS.conv(conversationId)).emit(CHAT_EVENTS.MESSAGE_NEW, message);
    for (const memberId of memberUserIds) {
      const unread = await this.redis.getUnread(memberId, conversationId);
      this.server.to(CHAT_ROOMS.user(memberId)).emit(CHAT_EVENTS.CONV_UPDATED, {
        conversationId,
        lastMessage: message,
        unreadCount: unread,
      });
    }
  }

  async emitReadUpdate(payload: {
    conversationId: number;
    userId: number;
    lastReadMessageId: number;
  }) {
    if (!this.server) return;
    this.server
      .to(CHAT_ROOMS.conv(payload.conversationId))
      .emit(CHAT_EVENTS.READ_UPDATE, payload);
  }
}
