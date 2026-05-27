import { createHash } from 'crypto';
import { EbookFormat } from '../entities/book-file.entity';

const MIME_TO_FORMAT: Record<string, EbookFormat> = {
  'application/pdf': EbookFormat.PDF,
  'application/epub+zip': EbookFormat.EPUB,
  'application/x-mobipocket-ebook': EbookFormat.MOBI,
  'application/vnd.amazon.ebook': EbookFormat.AZW3,
  'application/x-fictionbook+xml': EbookFormat.FB2,
};

const EXT_TO_FORMAT: Record<string, EbookFormat> = {
  pdf: EbookFormat.PDF,
  epub: EbookFormat.EPUB,
  mobi: EbookFormat.MOBI,
  azw: EbookFormat.AZW,
  azw3: EbookFormat.AZW3,
  fb2: EbookFormat.FB2,
};

/**
 * Ưu tiên detect theo extension (đáng tin hơn mime trên Google Drive,
 * nhiều file .epub bị gắn nhầm `application/octet-stream`).
 */
export function detectEbookFormat(filename: string, mimeType?: string | null): EbookFormat {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (EXT_TO_FORMAT[ext]) return EXT_TO_FORMAT[ext];
  if (mimeType && MIME_TO_FORMAT[mimeType]) return MIME_TO_FORMAT[mimeType];
  return EbookFormat.OTHER;
}

/**
 * Thứ tự ưu tiên chọn primary file khi 1 book có nhiều định dạng:
 * EPUB (reflowable, đẹp trên mobile) → PDF → MOBI → AZW3 → AZW → FB2 → OTHER.
 * Số càng nhỏ = ưu tiên càng cao.
 */
const FORMAT_PRIORITY: Record<string, number> = {
  [EbookFormat.EPUB]: 1,
  [EbookFormat.PDF]: 2,
  [EbookFormat.MOBI]: 3,
  [EbookFormat.AZW3]: 4,
  [EbookFormat.AZW]: 5,
  [EbookFormat.FB2]: 6,
  [EbookFormat.OTHER]: 99,
};

export function formatPriority(format: string): number {
  return FORMAT_PRIORITY[format] ?? 99;
}

export function pickPrimaryFormat<T extends { format: string }>(files: T[]): T | undefined {
  if (!files.length) return undefined;
  return [...files].sort((a, b) => formatPriority(a.format) - formatPriority(b.format))[0];
}

/**
 * Hash nhẹ cho việc phát hiện trùng nội dung mà không cần stream toàn file:
 *   sha1( buffer || ':' || size )
 * Caller chỉ nên truyền sample (vd: 1MB đầu) để tiết kiệm CPU/băng thông.
 */
export function lightweightHash(sampleBuffer: Buffer, fileSize: number): string {
  return createHash('sha1')
    .update(sampleBuffer)
    .update(':' + fileSize)
    .digest('hex');
}
