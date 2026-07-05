/**
 * Hợp đồng (contract) giữa NestJS backend và Python OCR worker thông qua message
 * queue. Backend "publish" job vào hàng đợi `ocr.jobs`, worker xử lý xong sẽ
 * "publish" kết quả vào hàng đợi `ocr.results` để backend consume.
 *
 * Tách interface khỏi implementation (RabbitMQ) để sau này có thể đổi sang
 * Redis/Kafka mà không phải sửa OcrService.
 */

/** Token DI để inject implementation của hàng đợi OCR. */
export const OCR_QUEUE = 'OCR_QUEUE';

/** Một bbox là danh sách các điểm [x, y] (PaddleOCR trả polygon 4 điểm). */
export type OcrBBox = number[][];

/** Preset style tài liệu để biên tập/áp dụng hàng loạt trên client. */
export type OcrTextPreset = 'body' | 'h1' | 'h2' | 'h3' | 'caption';

/** Style text ở mức dòng hoặc run (không phụ thuộc OCR engine gốc). */
export interface OcrTextStyle {
  fontFamily?: string;
  fontSize?: number;
  colorHex?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  align?: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: number;
  preset?: OcrTextPreset;
}

/** Một đoạn text có style riêng (rich-text). */
export interface OcrTextRun {
  text: string;
  style?: OcrTextStyle;
}

/** Message gửi cho worker để bắt đầu xử lý một job. */
export interface OcrJobMessage {
  jobId: number;
  /** URL public để worker tải file gốc. */
  fileUrl: string;
  /** Key trên S3 (nếu worker dùng credential tải trực tiếp). */
  fileKey?: string;
  /** 'vi' | 'en' | 'auto'. */
  lang: string;
  /** Chỉ OCR một số trang cụ thể (1-based). Bỏ trống = toàn bộ. */
  pages?: number[];
  /** 'text' | 'layout' — layout dùng PP-Structure để tách figure/table. */
  mode?: string;
  /** Có tách ảnh/figure/table nhúng trong trang hay không. */
  extractImages?: boolean;
}

/** Một dòng text OCR được trong một trang. */
export interface OcrLine {
  text: string;
  confidence: number;
  bbox: OcrBBox;
  /** Style tổng thể cho cả dòng (áp preset/header/body...). */
  style?: OcrTextStyle;
  /** Rich text theo từng đoạn trong dòng. */
  runs?: OcrTextRun[];
}

/** Ảnh/figure/table được tách ra từ một trang. */
export interface OcrAssetMessage {
  type: 'image' | 'figure' | 'table';
  bbox: OcrBBox;
  /** URL ảnh đã crop & upload (figure/image hoặc ảnh render của table). */
  imageUrl?: string;
  /** Key S3 của ảnh đã tách. */
  imageKey?: string;
  /** HTML của bảng (chỉ với type = 'table'). */
  tableHtml?: string;
  /** 'embedded' (PyMuPDF) | 'layout' (PP-Structure). */
  source?: string;
}

/** Kết quả OCR của một trang. */
export interface OcrResultPage {
  page: number;
  width: number;
  height: number;
  lines: OcrLine[];
  images?: OcrAssetMessage[];
  tables?: OcrAssetMessage[];
  /**
   * Ảnh raster đầy đủ của trang, đúng pixel space (width x height ở trên)
   * mà worker đã dùng để tính bbox. Client hiển thị ảnh này thay vì tự
   * render lại PDF để tránh lệch bbox do khác engine render.
   */
  pageImageUrl?: string;
  pageImageKey?: string;
}

/** Response API `GET /ocr/jobs/:id/result` — gộp text blocks + assets theo trang. */
export interface OcrPageResultDto {
  id: number;
  jobId: number;
  pageNumber: number;
  /** Alias `pageNumber` cho client (Flutter). */
  page: number;
  width: number;
  height: number;
  text: string | null;
  blocks: OcrLine[] | null;
  /** Alias `blocks` cho client. */
  lines: OcrLine[] | null;
  images: OcrAssetMessage[];
  tables: OcrAssetMessage[];
  /** Ảnh raster đầy đủ của trang (đúng pixel space đã dùng để OCR/tính bbox). */
  pageImageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Message worker trả về. Worker có thể gửi nhiều lần cho cùng một job:
 * - status = 'processing' kèm processedPages để cập nhật tiến độ.
 * - status = 'done' kèm toàn bộ (hoặc phần còn lại) pages.
 * - status = 'failed' kèm error.
 */
export interface OcrResultMessage {
  jobId: number;
  status: 'processing' | 'done' | 'failed';
  pages?: OcrResultPage[];
  processedPages?: number;
  totalPages?: number;
  error?: string;
}

/** Một dòng (text + bbox) gửi cho worker để dựng lớp text ẩn trong searchable PDF. */
export interface OcrExportLineInput {
  text: string;
  bbox: OcrBBox;
}

/** Ảnh/figure đã tách — chèn vào PDF text-only (không dùng ảnh trang gốc). */
export interface OcrExportAssetInput {
  type: 'image' | 'figure' | 'table';
  bbox: OcrBBox;
  imageUrl?: string;
  imageKey?: string;
}

/** Dữ liệu một trang phục vụ export. */
export interface OcrExportPageInput {
  page: number;
  width: number;
  height: number;
  lines: OcrExportLineInput[];
  assets?: OcrExportAssetInput[];
}

/**
 * Message yêu cầu worker tạo file export (PDF).
 * Mặc định `includeSourceImage: false` → chỉ text + figure đã tách trên nền trắng.
 * Bật `includeSourceImage: true` → searchable PDF (ảnh gốc + lớp text ẩn).
 */
export interface OcrExportMessage {
  jobId: number;
  format: 'pdf';
  /** Chỉ cần khi includeSourceImage = true. */
  fileUrl?: string;
  fileKey?: string;
  lang: string;
  /** false (mặc định): PDF sạch — text đã chỉnh + ảnh tách, không ảnh scan gốc. */
  includeSourceImage?: boolean;
  pages: OcrExportPageInput[];
}

/** Kết quả export worker trả về. */
export interface OcrExportResultMessage {
  jobId: number;
  format: 'pdf';
  status: 'done' | 'failed';
  /** URL public của file export đã upload. */
  url?: string;
  /** Key S3 của file export. */
  key?: string;
  error?: string;
}

/**
 * Abstraction của hàng đợi OCR. OcrService chỉ phụ thuộc vào interface này.
 */
export interface OcrQueue {
  /** Đẩy một job vào hàng đợi `ocr.jobs`. */
  publishJob(job: OcrJobMessage): Promise<void>;

  /**
   * Đăng ký handler xử lý kết quả từ `ocr.results`. Implementation phải tự
   * (re)apply handler mỗi khi kết nối lại để không mất message khi reconnect.
   */
  consumeResults(handler: (message: OcrResultMessage) => Promise<void>): Promise<void>;

  /** Đẩy một yêu cầu export vào hàng đợi `ocr.export`. */
  publishExport(message: OcrExportMessage): Promise<void>;

  /** Đăng ký handler xử lý kết quả export từ `ocr.export.results`. */
  consumeExportResults(
    handler: (message: OcrExportResultMessage) => Promise<void>,
  ): Promise<void>;

  /** Cho biết hàng đợi đã sẵn sàng publish hay chưa (để controller báo lỗi sớm). */
  isReady(): boolean;
}
