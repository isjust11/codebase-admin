import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OcrJob, OcrJobStatus } from '../../entities/ocr-job.entity';
import { OcrResult } from '../../entities/ocr-result.entity';
import { OcrAsset } from '../../entities/ocr-asset.entity';
import { MediaService } from '../media.service';
import {
  OCR_QUEUE,
  OcrAssetMessage,
  OcrExportResultMessage,
  OcrPageResultDto,
  OcrQueue,
  OcrResultMessage,
  OcrResultPage,
} from '../../queues/ocr-queue.interface';
import { OcrGateway } from '../../gateways/ocr.gateway';
import { getMessages, SupportedLocale } from '../../constants/messages';

export interface CreateOcrJobInput {
  lang?: string;
  mode?: string;
  extractImages?: boolean;
  pages?: number[];
}

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);

  constructor(
    @InjectRepository(OcrJob)
    private readonly jobRepo: Repository<OcrJob>,
    @InjectRepository(OcrResult)
    private readonly resultRepo: Repository<OcrResult>,
    @InjectRepository(OcrAsset)
    private readonly assetRepo: Repository<OcrAsset>,
    private readonly mediaService: MediaService,
    @Inject(OCR_QUEUE)
    private readonly queue: OcrQueue,
    private readonly gateway: OcrGateway,
  ) {}

  /**
   * Tạo job OCR: upload file lên S3 → lưu job (queued) → publish vào hàng đợi.
   * Nếu queue chưa sẵn sàng, job vẫn được lưu để có thể publish lại sau.
   */
  async createJob(
    userId: number,
    file: Express.Multer.File,
    input: CreateOcrJobInput,
    locale: SupportedLocale = 'vi',
  ): Promise<OcrJob> {
    if (!file) {
      throw new BadRequestException(getMessages(locale).ocr.fileRequired);
    }

    const media = await this.mediaService.uploadFromBuffer(
      file.buffer,
      file.originalname,
      file.mimetype,
      'ocr',
      userId,
    );

    const job = this.jobRepo.create({
      userId,
      fileUrl: media.url,
      fileKey: media.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size ?? 0,
      lang: input.lang || 'auto',
      mode: input.mode || 'layout',
      extractImages: input.extractImages ?? true,
      status: OcrJobStatus.QUEUED,
      processedPages: 0,
    });
    const saved = await this.jobRepo.save(job);

    try {
      await this.queue.publishJob({
        jobId: saved.id,
        fileUrl: saved.fileUrl,
        fileKey: saved.fileKey ?? undefined,
        lang: saved.lang,
        mode: saved.mode,
        extractImages: saved.extractImages,
        pages: input.pages,
      });
    } catch (error) {
      this.logger.warn(
        `Không publish được OCR job #${saved.id}: ${(error as Error).message}. Job giữ trạng thái queued.`,
      );
    }

    return saved;
  }

  /** Đẩy lại job vào hàng đợi (retry thủ công khi worker/queue gặp sự cố). */
  async requeueJob(
    userId: number,
    jobId: number,
    locale: SupportedLocale = 'vi',
  ): Promise<OcrJob> {
    const job = await this.getJob(userId, jobId, locale);
    job.status = OcrJobStatus.QUEUED;
    job.error = null;
    job.processedPages = 0;
    await this.jobRepo.save(job);
    await this.queue.publishJob({
      jobId: job.id,
      fileUrl: job.fileUrl,
      fileKey: job.fileKey ?? undefined,
      lang: job.lang,
      mode: job.mode,
      extractImages: job.extractImages,
    });
    return job;
  }

  async getJobs(
    userId: number,
    page = 1,
    size = 20,
    status?: string,
  ): Promise<{
    data: OcrJob[];
    total: number;
    page: number;
    size: number;
    totalPages: number;
  }> {
    const where: Record<string, unknown> = { userId };
    if (status) {
      where.status = status;
    }
    const [data, total] = await this.jobRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * size,
      take: size,
    });
    return { data, total, page, size, totalPages: Math.ceil(total / size) };
  }

  async getJob(
    userId: number,
    jobId: number,
    locale: SupportedLocale = 'vi',
  ): Promise<OcrJob> {
    const job = await this.jobRepo.findOne({ where: { id: jobId, userId } });
    if (!job) {
      throw new NotFoundException(getMessages(locale).ocr.jobNotFound);
    }
    return job;
  }

  /** Lấy kết quả OCR theo trang (text blocks + ảnh/bảng kèm bbox). */
  async getResult(
    userId: number,
    jobId: number,
    page?: number,
    locale: SupportedLocale = 'vi',
  ): Promise<OcrPageResultDto[]> {
    await this.getJob(userId, jobId, locale); // đảm bảo quyền sở hữu
    const where: Record<string, unknown> = { jobId };
    if (page) {
      where.pageNumber = page;
    }
    const [results, assets] = await Promise.all([
      this.resultRepo.find({
        where,
        order: { pageNumber: 'ASC' },
      }),
      this.assetRepo.find({
        where: page ? { jobId, pageNumber: page } : { jobId },
        order: { pageNumber: 'ASC', id: 'ASC' },
      }),
    ]);

    return results.map((result) =>
      this.toPageResultDto(
        result,
        assets.filter((asset) => asset.pageNumber === result.pageNumber),
      ),
    );
  }

  /**
   * Lưu dữ liệu đã chỉnh sửa từ OCR editor.
   * - Upsert từng trang vào `ocr_result` (text/blocks/size/pageImage).
   * - Ghi đè assets theo trang để phản ánh chính xác thao tác xóa/sửa/thêm.
   */
  async saveEditedResult(
    userId: number,
    jobId: number,
    pages: OcrResultPage[],
    locale: SupportedLocale = 'vi',
  ): Promise<{ savedPages: number }> {
    if (!Array.isArray(pages) || pages.length === 0) {
      throw new BadRequestException('Dữ liệu trang chỉnh sửa không hợp lệ.');
    }
    await this.getJob(userId, jobId, locale);

    for (const page of pages) {
      await this.upsertResultPage(jobId, page);
    }
    return { savedPages: pages.length };
  }

  async getAssets(
    userId: number,
    jobId: number,
    page?: number,
    type?: string,
    locale: SupportedLocale = 'vi',
  ): Promise<OcrAsset[]> {
    await this.getJob(userId, jobId, locale);
    const where: Record<string, unknown> = { jobId };
    if (page) {
      where.pageNumber = page;
    }
    if (type) {
      where.type = type;
    }
    return this.assetRepo.find({
      where,
      order: { pageNumber: 'ASC', id: 'ASC' },
    });
  }

  /**
   * Xử lý message kết quả từ worker. Idempotent: upsert theo (jobId, pageNumber)
   * và ghi đè assets của trang để worker có thể gửi lại an toàn.
   */
  async handleResult(message: OcrResultMessage): Promise<void> {
    const job = await this.jobRepo.findOne({ where: { id: message.jobId } });
    if (!job) {
      this.logger.warn(`Nhận kết quả cho job #${message.jobId} không tồn tại.`);
      return;
    }

    if (typeof message.totalPages === 'number') {
      job.totalPages = message.totalPages;
    }

    if (message.pages?.length) {
      for (const pageResult of message.pages) {
        await this.upsertResultPage(job.id, pageResult);
      }
    }

    if (typeof message.processedPages === 'number') {
      job.processedPages = message.processedPages;
    } else if (message.pages?.length) {
      job.processedPages = Math.max(job.processedPages, message.pages.length);
    }

    if (message.status === 'failed') {
      job.status = OcrJobStatus.FAILED;
      job.error = message.error ?? 'OCR thất bại.';
    } else if (message.status === 'done') {
      job.status = OcrJobStatus.DONE;
      if (job.totalPages) {
        job.processedPages = job.totalPages;
      }
    } else if (
      job.status !== OcrJobStatus.DONE &&
      job.status !== OcrJobStatus.FAILED
    ) {
      // Không hạ cấp job đã kết thúc về 'processing' — message tiến độ có thể
      // đến trễ / bị redeliver sau message 'done'.
      job.status = OcrJobStatus.PROCESSING;
    }

    await this.jobRepo.save(job);

    this.gateway.emitJobUpdate({
      jobId: job.id,
      status: job.status,
      processedPages: job.processedPages,
      totalPages: job.totalPages,
      error: job.error,
    });
  }

  /**
   * Export kết quả OCR.
   * - 'txt': ghép text các trang, upload S3, trả URL ngay (đồng bộ).
   * - 'pdf': gửi yêu cầu sang worker dựng searchable PDF (bất đồng bộ),
   *   trả về trạng thái 'processing'; kết quả cập nhật qua handleExportResult.
   */
  async exportJob(
    userId: number,
    jobId: number,
    format: 'txt' | 'pdf',
    locale: SupportedLocale = 'vi',
  ): Promise<{ format: string; url?: string; status?: string }> {
    const job = await this.getJob(userId, jobId, locale);
    const messages = getMessages(locale).ocr;

    const results = await this.resultRepo.find({
      where: { jobId },
      order: { pageNumber: 'ASC' },
    });
    if (!results.length) {
      throw new BadRequestException(messages.exportNoResult);
    }

    if (format === 'txt') {
      const text = results
        .map(
          (r) =>
            `--- ${messages.exportPageLabel} ${r.pageNumber} ---\n${r.text ?? ''}`,
        )
        .join('\n\n');
      const media = await this.mediaService.uploadFromBuffer(
        Buffer.from(text, 'utf-8'),
        `ocr-${jobId}.txt`,
        'text/plain; charset=utf-8',
        'ocr/export',
        userId,
      );
      job.txtUrl = media.url;
      await this.jobRepo.save(job);
      return { format: 'txt', url: media.url };
    }

    // format === 'pdf' → async qua worker.
    const pages = results.map((r) => ({
      page: r.pageNumber,
      lines: (r.blocks ?? []).map((line) => ({
        text: line.text,
        bbox: line.bbox,
      })),
    }));

    job.exportStatus = 'processing';
    job.exportError = null;
    await this.jobRepo.save(job);

    await this.queue.publishExport({
      jobId: job.id,
      format: 'pdf',
      fileUrl: job.fileUrl,
      fileKey: job.fileKey ?? undefined,
      lang: job.lang,
      pages,
    });

    return { format: 'pdf', status: 'processing' };
  }

  /** Xử lý kết quả export từ worker (cập nhật pdfUrl / lỗi + bắn realtime). */
  async handleExportResult(message: OcrExportResultMessage): Promise<void> {
    const job = await this.jobRepo.findOne({ where: { id: message.jobId } });
    if (!job) {
      this.logger.warn(
        `Nhận export result cho job #${message.jobId} không tồn tại.`,
      );
      return;
    }

    if (message.status === 'done') {
      job.pdfUrl = message.url ?? null;
      job.exportStatus = 'done';
      job.exportError = null;
    } else {
      job.exportStatus = 'failed';
      job.exportError = message.error ?? 'Export thất bại.';
    }
    await this.jobRepo.save(job);

    this.gateway.emitJobUpdate({
      jobId: job.id,
      status: job.status,
      processedPages: job.processedPages,
      totalPages: job.totalPages,
      error: job.exportError,
    });
  }

  private async upsertResultPage(
    jobId: number,
    pageResult: OcrResultPage,
  ): Promise<void> {
    const lines = (pageResult.lines ?? []).map((line) => ({
      text: line.text ?? '',
      confidence: line.confidence ?? 0,
      bbox: line.bbox ?? [],
      style: (line as any).style ?? undefined,
      runs: (line as any).runs ?? undefined,
    }));
    const text = lines.map((line) => line.text).join('\n');

    let result = await this.resultRepo.findOne({
      where: { jobId, pageNumber: pageResult.page },
    });
    if (!result) {
      result = this.resultRepo.create({ jobId, pageNumber: pageResult.page });
    }
    result.width = pageResult.width ?? 0;
    result.height = pageResult.height ?? 0;
    result.text = text;
    result.blocks = lines;
    result.pageImageUrl = pageResult.pageImageUrl ?? null;
    result.pageImageKey = pageResult.pageImageKey ?? null;
    await this.resultRepo.save(result);

    const assets: OcrAssetMessage[] = [
      ...(pageResult.images ?? []),
      ...(pageResult.tables ?? []),
    ];
    // Ghi đè assets của trang để tránh trùng khi worker gửi lại.
    await this.assetRepo.delete({ jobId, pageNumber: pageResult.page });
    if (assets.length) {
      const entities = assets.map((asset) =>
        this.assetRepo.create({
          jobId,
          pageNumber: pageResult.page,
          type: asset.type,
          bbox: asset.bbox ?? null,
          imageUrl: asset.imageUrl ?? null,
          imageKey: asset.imageKey ?? null,
          tableHtml: asset.tableHtml ?? null,
          source: asset.source ?? 'layout',
        }),
      );
      await this.assetRepo.save(entities);
    }
  }

  private toPageResultDto(
    result: OcrResult,
    pageAssets: OcrAsset[],
  ): OcrPageResultDto {
    const images = pageAssets
      .filter((asset) => asset.type === 'image' || asset.type === 'figure')
      .map((asset) => this.assetToMessage(asset));
    const tables = pageAssets
      .filter((asset) => asset.type === 'table')
      .map((asset) => this.assetToMessage(asset));

    return {
      id: result.id,
      jobId: result.jobId,
      pageNumber: result.pageNumber,
      page: result.pageNumber,
      width: result.width,
      height: result.height,
      text: result.text,
      blocks: result.blocks,
      lines: result.blocks,
      images,
      tables,
      pageImageUrl: result.pageImageUrl,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  }

  private assetToMessage(asset: OcrAsset): OcrAssetMessage {
    return {
      type: asset.type as OcrAssetMessage['type'],
      bbox: asset.bbox ?? [],
      imageUrl: asset.imageUrl ?? undefined,
      imageKey: asset.imageKey ?? undefined,
      tableHtml: asset.tableHtml ?? undefined,
      source: asset.source ?? undefined,
    };
  }
}
