import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LookupRequestDto {
  @IsNotEmpty({ message: 'Query không được để trống' })
  @IsString()
  query: string;

  @IsOptional()
  @IsString()
  language?: string = 'vi'; // Mặc định trả lời tiếng Việt
}
