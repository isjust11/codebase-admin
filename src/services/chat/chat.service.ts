import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Repository } from 'typeorm';
import { ChatConversation } from '../../entities/chat-conversation.entity';
import { ChatConversationMember } from '../../entities/chat-conversation-member.entity';
import { ChatMessage } from '../../entities/chat-message.entity';
import { ChatMessageReceipt } from '../../entities/chat-message-receipt.entity';
import {
  ConversationMemberRole,
  ConversationType,
  MessageKind,
  MessageReceiptStatus,
} from '../../enums/chat.enum';
import {
  CHAT_DEFAULT_APP_ID,
  CHAT_MESSAGE_PAGE_SIZE,
} from '../../constants/chat.constants';
import {
  AddMembersDto,
  CreateDmDto,
  CreateGroupDto,
  MarkReadDto,
  SendMessageDto,
} from '../../dtos/chat/chat.dto';
import { ChatRedisService } from './chat-redis.service';
import { FcmService } from '../fcm.service';
import { NotificationType } from '../../enums/notification.enum';
import { User } from '../../entities/user.entity';

export type MessageDto = {
  id: number;
  conversationId: number;
  senderId: number;
  kind: MessageKind;
  body: string | null;
  attachments: Record<string, unknown>[] | null;
  clientMsgId: string;
  createdAt: Date;
  deletedAt: Date | null;
  sender?: { id: number; fullName?: string; picture?: string; username?: string };
};

export type ConversationListItem = {
  id: number;
  type: ConversationType;
  appId: string;
  title: string | null;
  refType: string | null;
  refId: string | null;
  lastMessageId: number | null;
  lastMessageAt: Date | null;
  lastMessagePreview: string | null;
  role: ConversationMemberRole;
  lastReadMessageId: number | null;
  unreadCount: number;
  peer?: { id: number; fullName?: string; picture?: string; username?: string };
};

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectRepository(ChatConversation)
    private readonly convRepo: Repository<ChatConversation>,
    @InjectRepository(ChatConversationMember)
    private readonly memberRepo: Repository<ChatConversationMember>,
    @InjectRepository(ChatMessage)
    private readonly messageRepo: Repository<ChatMessage>,
    @InjectRepository(ChatMessageReceipt)
    private readonly receiptRepo: Repository<ChatMessageReceipt>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly redis: ChatRedisService,
    @Inject(forwardRef(() => FcmService))
    private readonly fcmService: FcmService,
  ) {}

  resolveAppId(headerValue?: string | string[]): string {
    const raw = Array.isArray(headerValue) ? headerValue[0] : headerValue;
    const v = (raw ?? '').trim();
    return v || CHAT_DEFAULT_APP_ID;
  }

  private dmKey(a: number, b: number): string {
    return a < b ? `${a}:${b}` : `${b}:${a}`;
  }

  private preview(body?: string | null, kind?: MessageKind): string {
    if (kind === MessageKind.IMAGE) return '[image]';
    if (kind === MessageKind.FILE) return '[file]';
    if (kind === MessageKind.SYSTEM) return body?.slice(0, 120) ?? '';
    return (body ?? '').slice(0, 120);
  }

  async assertMember(
    conversationId: number,
    userId: number,
  ): Promise<ChatConversationMember> {
    const member = await this.memberRepo.findOne({
      where: { conversationId, userId },
    });
    if (!member) {
      throw new ForbiddenException('Not a member of this conversation');
    }
    return member;
  }

  async getOrCreateDm(
    userId: number,
    dto: CreateDmDto,
    appId: string,
  ): Promise<ChatConversation> {
    if (dto.peerUserId === userId) {
      throw new BadRequestException('Cannot create DM with yourself');
    }
    const peer = await this.userRepo.findOne({ where: { id: dto.peerUserId } });
    if (!peer || peer.isBlocked) {
      throw new NotFoundException('Peer user not found');
    }

    const key = this.dmKey(userId, dto.peerUserId);
    let conv = await this.convRepo.findOne({ where: { appId, dmKey: key } });
    if (conv) return conv;

    conv = this.convRepo.create({
      type: ConversationType.DM,
      appId,
      title: null,
      dmKey: key,
      refType: null,
      refId: null,
      lastMessageId: null,
      lastMessageAt: null,
      lastMessagePreview: null,
    });
    try {
      conv = await this.convRepo.save(conv);
    } catch {
      // Race: another request created it
      const existing = await this.convRepo.findOne({ where: { appId, dmKey: key } });
      if (existing) return existing;
      throw new BadRequestException('Failed to create DM');
    }

    await this.memberRepo.save([
      this.memberRepo.create({
        conversationId: conv.id,
        userId,
        appId,
        role: ConversationMemberRole.MEMBER,
        lastReadMessageId: null,
        joinedAt: new Date(),
      }),
      this.memberRepo.create({
        conversationId: conv.id,
        userId: dto.peerUserId,
        appId,
        role: ConversationMemberRole.MEMBER,
        lastReadMessageId: null,
        joinedAt: new Date(),
      }),
    ]);

    return conv;
  }

  async createGroup(
    userId: number,
    dto: CreateGroupDto,
    appId: string,
  ): Promise<ChatConversation> {
    const uniqueIds = [...new Set([userId, ...dto.memberIds])];
    const users = await this.userRepo.find({ where: { id: In(uniqueIds) } });
    if (users.length !== uniqueIds.length) {
      throw new BadRequestException('One or more members not found');
    }

    if (dto.refType && dto.refId) {
      const existing = await this.convRepo.findOne({
        where: { appId, refType: dto.refType, refId: dto.refId },
      });
      if (existing) return existing;
    }

    let conv = this.convRepo.create({
      type: ConversationType.GROUP,
      appId,
      title: dto.title,
      dmKey: null,
      refType: dto.refType ?? null,
      refId: dto.refId ?? null,
      lastMessageId: null,
      lastMessageAt: null,
      lastMessagePreview: null,
    });
    conv = await this.convRepo.save(conv);

    const members = uniqueIds.map((uid) =>
      this.memberRepo.create({
        conversationId: conv.id,
        userId: uid,
        appId,
        role:
          uid === userId
            ? ConversationMemberRole.ADMIN
            : ConversationMemberRole.MEMBER,
        lastReadMessageId: null,
        joinedAt: new Date(),
      }),
    );
    await this.memberRepo.save(members);
    return conv;
  }

  /**
   * Ensure a group exists for an external domain ref (e.g. campaign).
   * Exported for other modules (Green Vietnam campaigns).
   */
  async ensureGroupForRef(params: {
    appId: string;
    refType: string;
    refId: string;
    title: string;
    creatorUserId: number;
    memberIds?: number[];
  }): Promise<ChatConversation> {
    const existing = await this.convRepo.findOne({
      where: {
        appId: params.appId,
        refType: params.refType,
        refId: params.refId,
      },
    });
    if (existing) return existing;

    return this.createGroup(
      params.creatorUserId,
      {
        title: params.title,
        memberIds: params.memberIds ?? [],
        refType: params.refType,
        refId: params.refId,
      },
      params.appId,
    );
  }

  async addMembers(
    conversationId: number,
    actorUserId: number,
    dto: AddMembersDto,
    appId: string,
  ): Promise<ChatConversationMember[]> {
    const actor = await this.assertMember(conversationId, actorUserId);
    if (actor.role !== ConversationMemberRole.ADMIN) {
      throw new ForbiddenException('Only admins can add members');
    }
    const conv = await this.convRepo.findOne({ where: { id: conversationId, appId } });
    if (!conv || conv.type !== ConversationType.GROUP) {
      throw new BadRequestException('Can only add members to a group');
    }

    const existing = await this.memberRepo.find({ where: { conversationId } });
    const existingIds = new Set(existing.map((m) => m.userId));
    const toAdd = [...new Set(dto.memberIds)].filter((id) => !existingIds.has(id));
    if (!toAdd.length) return [];

    const users = await this.userRepo.find({ where: { id: In(toAdd) } });
    if (users.length !== toAdd.length) {
      throw new BadRequestException('One or more members not found');
    }

    const rows = toAdd.map((uid) =>
      this.memberRepo.create({
        conversationId,
        userId: uid,
        appId,
        role: ConversationMemberRole.MEMBER,
        lastReadMessageId: null,
        joinedAt: new Date(),
      }),
    );
    return this.memberRepo.save(rows);
  }

  async listInbox(
    userId: number,
    appId: string,
    cursor?: string,
    limit = 30,
  ): Promise<{ items: ConversationListItem[]; nextCursor: string | null }> {
    const take = Math.min(Math.max(limit, 1), 50);
    const qb = this.memberRepo
      .createQueryBuilder('m')
      .innerJoinAndSelect('m.conversation', 'c')
      .where('m.userId = :userId', { userId })
      .andWhere('m.appId = :appId', { appId })
      .orderBy('c.lastMessageAt', 'DESC')
      .addOrderBy('c.id', 'DESC')
      .take(take + 1);

    if (cursor) {
      const [ts, id] = cursor.split('_');
      qb.andWhere(
        '(c.lastMessageAt < :ts OR (c.lastMessageAt = :ts AND c.id < :cid) OR (c.lastMessageAt IS NULL AND c.id < :cid))',
        { ts: new Date(ts), cid: Number(id) },
      );
    }

    const rows = await qb.getMany();
    const page = rows.slice(0, take);
    const convIds = page.map((r) => Number(r.conversationId));
    const unreadMap = await this.redis.getUnreadMap(userId, convIds);

    // For DMs, load peer profile
    const dmConvIds = page
      .filter((r) => r.conversation.type === ConversationType.DM)
      .map((r) => Number(r.conversationId));
    const peerByConv = new Map<number, User>();
    if (dmConvIds.length) {
      const peers = await this.memberRepo.find({
        where: { conversationId: In(dmConvIds) },
        relations: ['user'],
      });
      for (const p of peers) {
        if (p.userId !== userId) {
          peerByConv.set(Number(p.conversationId), p.user);
        }
      }
    }

    const items: ConversationListItem[] = page.map((r) => {
      const c = r.conversation;
      const peer = peerByConv.get(Number(c.id));
      return {
        id: Number(c.id),
        type: c.type,
        appId: c.appId,
        title: c.title,
        refType: c.refType,
        refId: c.refId,
        lastMessageId: c.lastMessageId != null ? Number(c.lastMessageId) : null,
        lastMessageAt: c.lastMessageAt,
        lastMessagePreview: c.lastMessagePreview,
        role: r.role,
        lastReadMessageId:
          r.lastReadMessageId != null ? Number(r.lastReadMessageId) : null,
        unreadCount: unreadMap[Number(c.id)] ?? 0,
        peer: peer
          ? {
              id: peer.id,
              fullName: peer.fullName,
              picture: peer.picture,
              username: peer.username,
            }
          : undefined,
      };
    });

    let nextCursor: string | null = null;
    if (rows.length > take) {
      const last = page[page.length - 1].conversation;
      const ts = last.lastMessageAt
        ? new Date(last.lastMessageAt).toISOString()
        : '1970-01-01T00:00:00.000Z';
      nextCursor = `${ts}_${last.id}`;
    }

    return { items, nextCursor };
  }

  async listMessages(
    conversationId: number,
    userId: number,
    beforeId?: number,
    limit = CHAT_MESSAGE_PAGE_SIZE,
  ): Promise<{ items: MessageDto[]; hasMore: boolean }> {
    await this.assertMember(conversationId, userId);
    const take = Math.min(Math.max(limit, 1), CHAT_MESSAGE_PAGE_SIZE);

    const where: Record<string, unknown> = { conversationId };
    if (beforeId) {
      where.id = LessThan(beforeId);
    }

    const rows = await this.messageRepo.find({
      where: where as any,
      relations: ['sender'],
      order: { id: 'DESC' },
      take: take + 1,
    });

    const page = rows.slice(0, take);
    const items = page.map((m) => this.toMessageDto(m)).reverse();
    return { items, hasMore: rows.length > take };
  }

  toMessageDto(m: ChatMessage): MessageDto {
    const deleted = !!m.deletedAt;
    return {
      id: Number(m.id),
      conversationId: Number(m.conversationId),
      senderId: m.senderId,
      kind: m.kind,
      body: deleted ? null : m.body,
      attachments: deleted ? null : m.attachments,
      clientMsgId: m.clientMsgId,
      createdAt: m.createdAt,
      deletedAt: m.deletedAt,
      sender: m.sender
        ? {
            id: m.sender.id,
            fullName: m.sender.fullName,
            picture: m.sender.picture,
            username: m.sender.username,
          }
        : undefined,
    };
  }

  /**
   * Persist message idempotently by (conversationId, senderId, clientMsgId).
   */
  async sendMessage(
    userId: number,
    dto: SendMessageDto,
    options?: { skipPush?: boolean },
  ): Promise<{ message: MessageDto; created: boolean; memberUserIds: number[] }> {
    await this.assertMember(dto.conversationId, userId);

    if (!dto.body?.trim() && !(dto.attachments?.length)) {
      throw new BadRequestException('Message body or attachments required');
    }

    const existing = await this.messageRepo.findOne({
      where: {
        conversationId: dto.conversationId,
        senderId: userId,
        clientMsgId: dto.clientMsgId,
      },
      relations: ['sender'],
    });
    if (existing) {
      const members = await this.memberRepo.find({
        where: { conversationId: dto.conversationId },
      });
      return {
        message: this.toMessageDto(existing),
        created: false,
        memberUserIds: members.map((m) => m.userId),
      };
    }

    const kind = dto.kind ?? (dto.attachments?.length ? MessageKind.IMAGE : MessageKind.TEXT);
    let saved: ChatMessage;
    try {
      saved = await this.messageRepo.save(
        this.messageRepo.create({
          conversationId: dto.conversationId,
          senderId: userId,
          kind,
          body: dto.body?.trim() ?? null,
          attachments: dto.attachments
            ? (dto.attachments as unknown as Record<string, unknown>[])
            : null,
          clientMsgId: dto.clientMsgId,
        }),
      );
    } catch {
      const raced = await this.messageRepo.findOne({
        where: {
          conversationId: dto.conversationId,
          senderId: userId,
          clientMsgId: dto.clientMsgId,
        },
        relations: ['sender'],
      });
      if (raced) {
        const members = await this.memberRepo.find({
          where: { conversationId: dto.conversationId },
        });
        return {
          message: this.toMessageDto(raced),
          created: false,
          memberUserIds: members.map((m) => m.userId),
        };
      }
      throw new BadRequestException('Failed to send message');
    }

    const withSender = await this.messageRepo.findOne({
      where: { id: saved.id },
      relations: ['sender'],
    });

    await this.convRepo.update(dto.conversationId, {
      lastMessageId: saved.id,
      lastMessageAt: saved.createdAt,
      lastMessagePreview: this.preview(saved.body, saved.kind),
    });

    const members = await this.memberRepo.find({
      where: { conversationId: dto.conversationId },
    });

    // Unread + optional FCM for offline peers
    await Promise.all(
      members
        .filter((m) => m.userId !== userId)
        .map(async (m) => {
          await this.redis.incrUnread(m.userId, dto.conversationId);
          if (!options?.skipPush && this.fcmService) {
            const online = await this.redis.isOnline(m.userId);
            const muted =
              m.mutedUntil != null && new Date(m.mutedUntil).getTime() > Date.now();
            if (!options?.skipPush && !online && !muted) {
              await this.pushNewMessage(m.userId, withSender!);
            }
          }
        }),
    );

    return {
      message: this.toMessageDto(withSender!),
      created: true,
      memberUserIds: members.map((m) => m.userId),
    };
  }

  private async pushNewMessage(userId: number, message: ChatMessage) {
    try {
      const preview =
        message.body?.slice(0, 80) ||
        (message.kind === MessageKind.IMAGE ? 'Đã gửi một ảnh' : 'Tin nhắn mới');
      await this.fcmService.sendToUser(userId, {
        title: 'Tin nhắn mới',
        body: preview,
        type: NotificationType.CHAT,
        data: {
          type: 'CHAT',
          conversationId: String(message.conversationId),
          messageId: String(message.id),
        },
      });
    } catch (err) {
      this.logger.warn(`FCM push failed for user ${userId}: ${(err as Error).message}`);
    }
  }

  async markRead(
    conversationId: number,
    userId: number,
    dto: MarkReadDto,
  ): Promise<{ conversationId: number; userId: number; lastReadMessageId: number }> {
    await this.assertMember(conversationId, userId);
    await this.memberRepo.update(
      { conversationId, userId },
      { lastReadMessageId: dto.lastReadMessageId },
    );
    await this.redis.resetUnread(userId, conversationId);

    // Upsert read receipt on the message (best-effort)
    try {
      const existing = await this.receiptRepo.findOne({
        where: { messageId: dto.lastReadMessageId, userId },
      });
      if (!existing) {
        await this.receiptRepo.save(
          this.receiptRepo.create({
            messageId: dto.lastReadMessageId,
            userId,
            status: MessageReceiptStatus.READ,
          }),
        );
      } else if (existing.status !== MessageReceiptStatus.READ) {
        existing.status = MessageReceiptStatus.READ;
        await this.receiptRepo.save(existing);
      }
    } catch (err) {
      this.logger.debug(`Receipt upsert skipped: ${(err as Error).message}`);
    }

    return {
      conversationId,
      userId,
      lastReadMessageId: dto.lastReadMessageId,
    };
  }

  async softDeleteMessage(messageId: number, userId: number): Promise<MessageDto> {
    const msg = await this.messageRepo.findOne({
      where: { id: messageId },
      relations: ['sender'],
    });
    if (!msg) throw new NotFoundException('Message not found');
    await this.assertMember(Number(msg.conversationId), userId);
    if (msg.senderId !== userId) {
      throw new ForbiddenException('Can only delete your own messages');
    }
    msg.deletedAt = new Date();
    await this.messageRepo.save(msg);
    return this.toMessageDto(msg);
  }

  async getMemberUserIds(conversationId: number): Promise<number[]> {
    const members = await this.memberRepo.find({ where: { conversationId } });
    return members.map((m) => m.userId);
  }

  async getConversation(conversationId: number, appId: string): Promise<ChatConversation> {
    const conv = await this.convRepo.findOne({ where: { id: conversationId, appId } });
    if (!conv) throw new NotFoundException('Conversation not found');
    return conv;
  }
}
