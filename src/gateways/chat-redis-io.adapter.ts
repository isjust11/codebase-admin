import { INestApplication, Logger } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { ServerOptions } from 'socket.io';
import Redis from 'ioredis';

/**
 * Socket.IO adapter with optional Redis pub/sub for multi-instance fan-out.
 * When REDIS_URL is missing, falls back to default in-memory adapter.
 */
export class ChatRedisIoAdapter extends IoAdapter {
  private readonly logger = new Logger(ChatRedisIoAdapter.name);
  private adapterConstructor: ReturnType<typeof createAdapter> | null = null;

  constructor(private readonly app: INestApplication) {
    super(app);
  }

  async connectToRedis(): Promise<void> {
    const url = process.env.REDIS_URL;
    if (!url) {
      this.logger.warn('REDIS_URL not set — Socket.IO uses in-memory adapter');
      return;
    }
    try {
      const pubClient = new Redis(url, {
        maxRetriesPerRequest: null,
        enableReadyCheck: true,
      });
      const subClient = pubClient.duplicate();
      const waitReady = (client: Redis) =>
        client.status === 'ready'
          ? Promise.resolve()
          : new Promise<void>((resolve, reject) => {
              client.once('ready', () => resolve());
              client.once('error', reject);
            });
      await Promise.all([waitReady(pubClient), waitReady(subClient)]);
      this.adapterConstructor = createAdapter(pubClient, subClient);
      this.logger.log('Socket.IO Redis adapter ready');
    } catch (err) {
      this.logger.error(
        `Socket.IO Redis adapter failed: ${(err as Error).message}`,
      );
      this.adapterConstructor = null;
    }
  }

  createIOServer(port: number, options?: ServerOptions) {
    const server = super.createIOServer(port, options);
    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
    }
    return server;
  }
}
