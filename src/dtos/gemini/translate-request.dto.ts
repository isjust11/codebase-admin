import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class TranslateRequestDto {
  @IsNotEmpty({ message: 'Text không được để trống' })
  @IsString()
  text: string;

  @IsNotEmpty({ message: 'Ngôn ngữ đích không được để trống' })
  @IsString()
  targetLanguage: string; // Ví dụ: "vi", "en", "fr", "ja", "zh", ...

  @IsOptional()
  @IsString()
  sourceLanguage?: string; // Mặc định auto-detect
}
