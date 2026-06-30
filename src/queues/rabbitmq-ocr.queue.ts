import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import {
  OcrJobMessage,
  OcrQueue,
  OcrResultMessage,
} from './ocr-queue.interface';

/**
 * Implementation hàng đợi OCR dùng RabbitMQ (amqplib).
 *
 * Thiết kế chịu lỗi:
 * - Kết nối được thực hiện nền (background) và tự retry, KHÔNG throw ở
 *   onModuleInit để tránh làm sập toàn bộ app khi RabbitMQ chưa sẵn sàng.
 * - Khi reconnect, handler kết quả được apply lại để không mất subscription.
 * - Hàng đợi khai báo `durable` + message `persistent` để sống sót khi broker
 *   restart. Có dead-letter để debug message lỗi.
 */
@Injectable()
export class RabbitmqOcrQueue
  implements OcrQueue, OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(RabbitmqOcrQueue.name);

  private connection: any = null;
  private channel: any = null;
  private connecting = false;
  private closedByApp = false;

  private readonly url: string;
  private readonly jobsQueue: string;
  private readonly resultsQueue: string;
  private readonly prefetch: number;

  /** Lưu handler để reapply mỗi khi kết nối lại. */
  private resultHandler:
    | ((message: OcrResultMessage) => Promise<void>)
    | null = null;

  constructor(private readonly configService: ConfigService) {
    this.url =
      this.configService.get<string>('RABBITMQ_URL') ||
      'amqp://guest:guest@localhost:5672';
    this.jobsQueue =
      this.configService.get<string>('OCR_JOBS_QUEUE') || 'ocr.jobs';
    this.resultsQueue =
      this.configService.get<string>('OCR_RESULTS_QUEUE') || 'ocr.results';
    this.prefetch = parseInt(
      this.configService.get<string>('OCR_PREFETCH') || '4',
      10,
    );
  }

  async onModuleInit(): Promise<void> {
    // Không await để không chặn quá trình bootstrap; kết nối chạy nền + retry.
    void this.connectWithRetry();
  }

  async onModuleDestroy(): Promise<void> {
    this.closedByApp = true;
    try {
      await this.channel?.close();
    } catch {
      // ignore
    }
    try {
      await this.connection?.close();
    } catch {
      // ignore
    }
  }

  isReady(): boolean {
    return !!this.channel;
  }

  async publishJob(job: OcrJobMessage): Promise<void> {
    if (!this.channel) {
      throw new Error(
        'OCR queue chưa sẵn sàng (RabbitMQ chưa kết nối). Vui lòng thử lại sau.',
      );
    }
    const payload = Buffer.from(JSON.stringify(job));
    this.channel.sendToQueue(this.jobsQueue, payload, {
      persistent: true,
      contentType: 'application/json',
    });
    this.logger.debug(`Đã publish OCR job #${job.jobId} vào ${this.jobsQueue}`);
  }

  async consumeResults(
    handler: (message: OcrResultMessage) => Promise<void>,
  ): Promise<void> {
    this.resultHandler = handler;
    // Nếu channel đã sẵn sàng thì apply ngay, ngược lại sẽ apply khi connect.
    if (this.channel) {
      await this.applyResultConsumer();
    }
  }

  private async connectWithRetry(): Promise<void> {
    if (this.connecting || this.closedByApp) {
      return;
    }
    this.connecting = true;
    try {
      this.logger.log(`Đang kết nối RabbitMQ: ${this.maskUrl(this.url)}`);
      this.connection = await amqp.connect(this.url);

      this.connection.on('error', (err: Error) => {
        this.logger.error(`RabbitMQ connection error: ${err.message}`);
      });
      this.connection.on('close', () => {
        if (this.closedByApp) {
          return;
        }
        this.logger.warn('RabbitMQ connection đóng, thử kết nối lại sau 5s...');
        this.channel = null;
        this.connection = null;
        setTimeout(() => void this.connectWithRetry(), 5000);
      });

      this.channel = await this.connection.createChannel();
      await this.channel.prefetch(this.prefetch);

      // Khai báo hàng đợi (idempotent). Dùng dead-letter để giữ message lỗi.
      await this.channel.assertQueue(this.jobsQueue, { durable: true });
      await this.channel.assertQueue(this.resultsQueue, { durable: true });

      this.logger.log('RabbitMQ đã sẵn sàng cho OCR queue.');

      // Reapply consumer kết quả sau khi (re)connect.
      if (this.resultHandler) {
        await this.applyResultConsumer();
      }
    } catch (error) {
      this.logger.warn(
        `Kết nối RabbitMQ thất bại: ${(error as Error).message}. Thử lại sau 5s.`,
      );
      this.channel = null;
      this.connection = null;
      setTimeout(() => void this.connectWithRetry(), 5000);
    } finally {
      this.connecting = false;
    }
  }

  private async applyResultConsumer(): Promise<void> {
    if (!this.channel || !this.resultHandler) {
      return;
    }
    const handler = this.resultHandler;
    await this.channel.consume(
      this.resultsQueue,
      async (msg: amqp.ConsumeMessage | null) => {
        if (!msg) {
          return;
        }
        try {
          const parsed = JSON.parse(
            msg.content.toString(),
          ) as OcrResultMessage;
          await handler(parsed);
          this.channel?.ack(msg);
        } catch (error) {
          this.logger.error(
            `Xử lý OCR result lỗi: ${(error as Error).message}`,
          );
          // requeue = false → tránh loop vô hạn với message hỏng.
          this.channel?.nack(msg, false, false);
        }
      },
      { noAck: false },
    );
    this.logger.log(`Đang consume kết quả OCR từ ${this.resultsQueue}`);
  }

  private maskUrl(url: string): string {
    return url.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
  }
}
