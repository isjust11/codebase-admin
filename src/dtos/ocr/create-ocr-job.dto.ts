import { IsArray, IsBooleanString, IsIn, IsOptional, IsString } from 'class-validator';

/**
 * Payload tạo job OCR. Vì gửi kèm file (multipart/form-data) nên các field
 * primitive sẽ tới dưới dạng string — controller sẽ tự coerce về kiểu phù hợp.
 */
export class CreateOcrJobDto {
  /** 'vi' | 'en' | 'auto'. */
  @IsOptional()
  @IsString()
  lang?: string;

  /** 'text' | 'layout'. */
  @IsOptional()
  @IsIn(['text', 'layout'])
  mode?: string;

  /** Chuỗi 'true' | 'false' từ form-data. */
  @IsOptional()
  @IsBooleanString()
  extractImages?: string;

  /** Danh sách trang cần OCR, ví dụ "1,2,5" hoặc mảng. */
  @IsOptional()
  @IsArray()
  pages?: number[];
}
