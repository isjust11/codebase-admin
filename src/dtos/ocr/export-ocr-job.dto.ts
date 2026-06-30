import { IsIn } from 'class-validator';

/** Payload yêu cầu export kết quả OCR. */
export class ExportOcrJobDto {
  /** Định dạng export: 'txt' (đồng bộ) | 'pdf' (searchable, bất đồng bộ). */
  @IsIn(['txt', 'pdf'])
  format: 'txt' | 'pdf';
}
