import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class UploadMediaDto {
  @IsString()
  filename: string;

  @IsString()
  originalName: string;

  @IsString()
  mimeType: string;

  @IsNumber()
  size: number;

  @IsString()
  path: string;

  @IsString()
  @IsOptional()
  url?: string;

  @IsNumber()
  userId: number;
}

export class UpdateMediaDto {
  @IsString()
  @IsOptional()
  filename?: string;

  @IsString()
  @IsOptional()
  originalName?: string;

  @IsString()
  @IsOptional()
  mimeType?: string;

  @IsNumber()
  @IsOptional()
  size?: number;

  @IsString()
  @IsOptional()
  path?: string;

  @IsString()
  @IsOptional()
  url?: string;

  @IsBoolean()
  @IsOptional()
  isDeleted?: boolean;

  @IsNumber()
  @IsOptional()
  userId?: number;
} 