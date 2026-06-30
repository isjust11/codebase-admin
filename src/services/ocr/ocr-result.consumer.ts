import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { OCR_QUEUE, OcrQueue } from '../../queues/ocr-queue.interface';
import { OcrService } from './ocr.service';

/**
 * Đăng ký consumer kết quả OCR khi module khởi động. Implementation của queue
 * tự reapply handler khi reconnect nên ở đây chỉ cần đăng ký một lần.
 */
@Injectable()
export class OcrResultConsumer implements OnModuleInit {
  private readonly logger = new Logger(OcrResultConsumer.name);

  constructor(
    @Inject(OCR_QUEUE) private readonly queue: OcrQueue,
    private readonly ocrService: OcrService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.queue.consumeResults(async (message) => {
      await this.ocrService.handleResult(message);
    });
    await this.queue.consumeExportResults(async (message) => {
      await this.ocrService.handleExportResult(message);
    });
    this.logger.log('Đã đăng ký consumer kết quả OCR + export.');
  }
}
