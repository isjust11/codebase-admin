import { IsArray } from 'class-validator';

/**
 * Payload lưu kết quả OCR đã biên tập từ mobile/web editor.
 * Client gửi toàn bộ các trang đã chỉnh sửa.
 */
export class SaveOcrResultDto {
  @IsArray()
  pages: any[];
}

