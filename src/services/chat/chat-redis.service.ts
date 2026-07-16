import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

/**
 * Thin Redis helper for chat presence + unread counters.
 * Falls back to in-memory Maps when REDIS_URL is unset (local single-instance).
 */
@Injectable()
export class ChatRedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ChatRedisService.name);
  private client: Redis | null = null;
  private readonly memPresence = new Map<number, number>(); // userId -> socketCount
  private readonly memUnread = new Map<string, number>(); // `${userId}:${convId}` -> count

  async onModuleInit() {
    const url = process.env.REDIS_URL;
    if (!url) {
      this.logger.warn('REDIS_URL not set — chat presence/unread use in-memory store');
      return;
    }
    try {
      this.client = new Redis(url, {
        maxRetriesPerRequest: 2,
        enableReadyCheck: true,
      });
      if (this.client.status !== 'ready') {
        await new Promise<void>((resolve, reject) => {
          this.client!.once('ready', () => resolve());
          this.client!.once('error', reject);
        });
      }
      this.logger.log('Chat Redis connected');
    } catch (err) {
      this.logger.error(`Chat Redis connect failed: ${(err as Error).message}`);
      this.client = null;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit().catch(() => undefined);
      this.client = null;
    }
  }

  /** Returns a dedicated Redis client for Socket.IO adapter (or null). */
  createAdapterClient(): Redis | null {
    const url = process.env.REDIS_URL;
    if (!url) return null;
    return new Redis(url, { maxRetriesPerRequest: null, enableReadyCheck: true });
  }

  isRedisAvailable(): boolean {
    return !!this.client;
  }

  private presenceKey(userId: number) {
    return `chat:presence:${userId}`;
  }

  private unreadKey(userId: number, conversationId: number) {
    return `chat:unread:${userId}:${conversationId}`;
  }

  async incrPresence(userId: number): Promise<number> {
    if (this.client) {
      return this.client.incr(this.presenceKey(userId));
    }
    const next = (this.memPresence.get(userId) ?? 0) + 1;
    this.memPresence.set(userId, next);
    return next;
  }

  async decrPresence(userId: number): Promise<number> {
    if (this.client) {
      const n = await this.client.decr(this.presenceKey(userId));
      if (n <= 0) {
        await this.client.del(this.presenceKey(userId));
        return 0;
      }
      return n;
    }
    const next = Math.max(0, (this.memPresence.get(userId) ?? 0) - 1);
    if (next === 0) this.memPresence.delete(userId);
    else this.memPresence.set(userId, next);
    return next;
  }

  async isOnline(userId: number): Promise<boolean> {
    if (this.client) {
      const n = await this.client.get(this.presenceKey(userId));
      return Number(n ?? 0) > 0;
    }
    return (this.memPresence.get(userId) ?? 0) > 0;
  }

  async incrUnread(userId: number, conversationId: number, by = 1): Promise<number> {
    if (this.client) {
      return this.client.incrby(this.unreadKey(userId, conversationId), by);
    }
    const k = `${userId}:${conversationId}`;
    const next = (this.memUnread.get(k) ?? 0) + by;
    this.memUnread.set(k, next);
    return next;
  }

  async resetUnread(userId: number, conversationId: number): Promise<void> {
    if (this.client) {
      await this.client.del(this.unreadKey(userId, conversationId));
      return;
    }
    this.memUnread.delete(`${userId}:${conversationId}`);
  }

  async getUnread(userId: number, conversationId: number): Promise<number> {
    if (this.client) {
      const n = await this.client.get(this.unreadKey(userId, conversationId));
      return Number(n ?? 0);
    }
    return this.memUnread.get(`${userId}:${conversationId}`) ?? 0;
  }

  async getUnreadMap(
    userId: number,
    conversationIds: number[],
  ): Promise<Record<number, number>> {
    const out: Record<number, number> = {};
    await Promise.all(
      conversationIds.map(async (id) => {
        out[id] = await this.getUnread(userId, id);
      }),
    );
    return out;
  }
}
