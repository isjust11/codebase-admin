import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Repository } from 'typeorm';
import { OcrJob, OcrJobStatus } from '../../entities/ocr-job.entity';
import { OcrGateway } from '../../gateways/ocr.gateway';

/**
 * Giám sát job OCR bị "kẹt" (queued/processing quá lâu — thường do worker chết
 * hoặc message thất lạc). Cảnh báo qua log; tùy chọn tự đánh dấu failed sau
 * ngưỡng cứng để job không treo mãi.
 *
 * Env:
 * - OCR_STUCK_WARN_MIN (mặc định 10): cảnh báo khi job chưa cập nhật quá X phút.
 * - OCR_STUCK_FAIL_MIN (mặc định 30): ngưỡng đánh dấu failed.
 * - OCR_STUCK_AUTOFAIL (mặc định false): có tự đánh dấu failed hay không.
 */
@Injectable()
export class OcrMaintenanceService {
  private readonly logger = new Logger(OcrMaintenanceService.name);

  private readonly warnMs =
    parseInt(process.env.OCR_STUCK_WARN_MIN || '10', 10) * 60_000;
  private readonly failMs =
    parseInt(process.env.OCR_STUCK_FAIL_MIN || '30', 10) * 60_000;
  private readonly autoFail =
    (process.env.OCR_STUCK_AUTOFAIL || 'false').toLowerCase() === 'true';

  constructor(
    @InjectRepository(OcrJob)
    private readonly jobRepo: Repository<OcrJob>,
    private readonly gateway: OcrGateway,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkStuckJobs(): Promise<void> {
    const now = Date.now();
    const warnBefore = new Date(now - this.warnMs);

    const stuck = await this.jobRepo.find({
      where: {
        status: In([OcrJobStatus.QUEUED, OcrJobStatus.PROCESSING]),
        updatedAt: LessThan(warnBefore),
      },
      order: { updatedAt: 'ASC' },
      take: 100,
    });

    if (!stuck.length) {
      return;
    }

    this.logger.warn(
      `[OCR-ALERT] ${stuck.length} job kẹt > ${this.warnMs / 60_000} phút: ` +
        stuck.map((j) => `#${j.id}(${j.status})`).join(', '),
    );

    if (!this.autoFail) {
      return;
    }

    const failBefore = now - this.failMs;
    for (const job of stuck) {
      if (job.updatedAt.getTime() > failBefore) {
        continue;
      }
      job.status = OcrJobStatus.FAILED;
      job.error = `Tự đánh dấu thất bại: job kẹt quá ${this.failMs / 60_000} phút.`;
      await this.jobRepo.save(job);
      this.gateway.emitJobUpdate({
        jobId: job.id,
        status: job.status,
        processedPages: job.processedPages,
        totalPages: job.totalPages,
        error: job.error,
      });
      this.logger.error(`[OCR-ALERT] Job #${job.id} đã bị đánh dấu failed.`);
    }
  }
}
