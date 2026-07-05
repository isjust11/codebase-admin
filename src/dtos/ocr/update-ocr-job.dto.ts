import { IsArray, IsBooleanString, IsIn, IsOptional, IsString } from 'class-validator';

/**
 * Payload tạo job OCR. Vì gửi kèm file (multipart/form-data) nên các field
 * primitive sẽ tới dưới dạng string — controller sẽ tự coerce về kiểu phù hợp.
 */
export class UpdateOcrJobDto {
  /** Name of the job. */
  @IsOptional()
  @IsString()
  name?: string;

  /** Description of the job. */
  @IsOptional()
  @IsString()
  description?: string;
}
