import {
  Controller,
  Post,
  Get,
  Put,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PermissionGuard } from '../../guards/permission.guard';
import { RequirePermission } from '../../decorators/require-permissions.decorator';
import { BaseController } from '../base/base.controller';
import { OcrService } from '../../services/ocr/ocr.service';
import { CreateOcrJobDto } from '../../dtos/ocr/create-ocr-job.dto';
import { ExportOcrJobDto } from '../../dtos/ocr/export-ocr-job.dto';
import { SaveOcrResultDto } from '../../dtos/ocr/save-ocr-result.dto';
import { OcrRateLimitGuard } from '../../guards/ocr-rate-limit.guard';
import { Locale } from '../../decorators/locale.decorator';
import {
  getMessages,
  SupportedLocale,
} from '../../constants/messages';

/** Định dạng file đầu vào cho OCR. */
const ALLOWED_OCR_MIME = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/tiff',
];

/** Lấy locale từ header `Accept-Language` (dùng trong fileFilter của interceptor). */
function resolveLocale(req: any): SupportedLocale {
  const header: string = req?.headers?.['accept-language'] ?? '';
  const primary = header.split(',')[0].trim().split('-')[0].toLowerCase();
  return primary === 'en' ? 'en' : 'vi';
}

@Controller('ocr')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class OcrController extends BaseController {
  constructor(private readonly ocrService: OcrService) {
    super();
  }

  /**
   * Tạo job OCR mới.
   * POST /ocr/jobs  (multipart/form-data: file + lang/mode/extractImages/pages)
   */
  @Post('jobs')
  // @RequirePermission('CREATE', 'ocr')
  // @UseGuards(OcrRateLimitGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
      fileFilter: (req, file, cb) => {
        if (ALLOWED_OCR_MIME.includes(file.mimetype)) {
          cb(null, true);
        } else {
          const locale = resolveLocale(req);
          cb(
            new BadRequestException(
              getMessages(locale).ocr.unsupportedFormat(file.mimetype),
            ),
            false,
          );
        }
      },
    }),
  )
  async createJob(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateOcrJobDto,
    @Locale() locale: SupportedLocale,
    @Request() req,
    @Res() res: Response,
  ) {
    try {
      const job = await this.ocrService.createJob(
        req.user.id,
        file,
        {
          lang: dto.lang,
          mode: dto.mode,
          extractImages: this.parseBool(dto.extractImages, true),
          pages: this.parsePages(dto.pages),
        },
        locale,
      );
      return this.success(res, job);
    } catch (error) {
      return this.error(res, error);
    }
  }

  /**
   * Đẩy lại job vào hàng đợi.
   * POST /ocr/jobs/:id/requeue
   */
  @Post('jobs/:id/requeue')
  // @RequirePermission('CREATE', 'ocr')
  async requeue(
    @Param('id') id: string,
    @Locale() locale: SupportedLocale,
    @Request() req,
    @Res() res: Response,
  ) {
    try {
      const job = await this.ocrService.requeueJob(
        req.user.id,
        this.decode(id) as number,
        locale,
      );
      return this.success(res, job);
    } catch (error) {
      return this.error(res, error);
    }
  }

  /**
   * Danh sách job của user hiện tại.
   * GET /ocr/jobs?page=&size=&status=
   */
  @Get('jobs')
  // @RequirePermission('READ', 'ocr')
  async list(
    @Query('page') page: string,
    @Query('size') size: string,
    @Query('status') status: string,
    @Locale() locale: SupportedLocale,
    @Request() req,
    @Res() res: Response,
  ) {
    try {
      const pageNum = Number(page) || 1;
      const sizeNum = Number(size) || 20;
      const result = await this.ocrService.getJobs(
        req.user.id,
        pageNum,
        sizeNum,
        status,
      );
      return this.paginate(
        res,
        result.data,
        result.total,
        result.page,
        result.size,
        getMessages(locale).ocr.success,
      );
    } catch (error) {
      return this.error(res, error);
    }
  }

  /**
   * Chi tiết một job.
   * GET /ocr/jobs/:id
   */
  @Get('jobs/:id')
  // @RequirePermission('READ', 'ocr')
  async detail(
    @Param('id') id: string,
    @Locale() locale: SupportedLocale,
    @Request() req,
    @Res() res: Response,
  ) {
    try {
      const job = await this.ocrService.getJob(
        req.user.id,
        this.decode(id) as number,
        locale,
      );
      return this.success(res, job);
    } catch (error) {
      return this.error(res, error);
    }
  }

  /**
   * Kết quả OCR theo trang: text blocks + ảnh/figure/table kèm bbox.
   * GET /ocr/jobs/:id/result?page=
   */
  @Get('jobs/:id/result')
  // @RequirePermission('READ', 'ocr')
  async result(
    @Param('id') id: string,
    @Query('page') page: string,
    @Locale() locale: SupportedLocale,
    @Request() req,
    @Res() res: Response,
  ) {
    try {
      const data = await this.ocrService.getResult(
        req.user.id,
        this.decode(id) as number,
        page ? Number(page) : undefined,
        locale,
      );
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  /**
   * Lưu kết quả OCR đã biên tập (text/style/bbox/assets) từ editor client.
   * PUT /ocr/jobs/:id/result
   */
  @Put('jobs/:id/result')
  async saveResult(
    @Param('id') id: string,
    @Body() dto: SaveOcrResultDto,
    @Locale() locale: SupportedLocale,
    @Request() req,
    @Res() res: Response,
  ) {
    try {
      const data = await this.ocrService.saveEditedResult(
        req.user.id,
        this.decode(id) as number,
        dto.pages ?? [],
        locale,
      );
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  /**
   * Ảnh / figure / table đã tách.
   * GET /ocr/jobs/:id/assets?page=&type=
   */
  @Get('jobs/:id/assets')
  // @RequirePermission('READ', 'ocr')
  async assets(
    @Param('id') id: string,
    @Query('page') page: string,
    @Query('type') type: string,
    @Locale() locale: SupportedLocale,
    @Request() req,
    @Res() res: Response,
  ) {
    try {
      const data = await this.ocrService.getAssets(
        req.user.id,
        this.decode(id) as number,
        page ? Number(page) : undefined,
        type,
        locale,
      );
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  /**
   * Export kết quả OCR.
   * POST /ocr/jobs/:id/export  body: { format: 'txt' | 'pdf' }
   * - txt: trả URL ngay.
   * - pdf: trả { format:'pdf', status:'processing' }, theo dõi qua WS/`GET /ocr/jobs/:id`.
   */
  @Post('jobs/:id/export')
  // @RequirePermission('CREATE', 'ocr')
  async export(
    @Param('id') id: string,
    @Body() dto: ExportOcrJobDto,
    @Locale() locale: SupportedLocale,
    @Request() req,
    @Res() res: Response,
  ) {
    try {
      const data = await this.ocrService.exportJob(
        req.user.id,
        this.decode(id) as number,
        dto.format,
        locale,
      );
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  private parseBool(value: unknown, fallback: boolean): boolean {
    if (value === undefined || value === null || value === '') {
      return fallback;
    }
    if (typeof value === 'boolean') {
      return value;
    }
    return String(value).toLowerCase() === 'true';
  }

  private parsePages(value: unknown): number[] | undefined {
    if (!value) {
      return undefined;
    }
    if (Array.isArray(value)) {
      return value.map((v) => Number(v)).filter((n) => !Number.isNaN(n));
    }
    return String(value)
      .split(',')
      .map((v) => Number(v.trim()))
      .filter((n) => !Number.isNaN(n));
  }
}
