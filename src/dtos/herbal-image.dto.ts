import { IsString, IsOptional, IsNumber, IsBoolean, IsDateString, IsEnum } from 'class-validator';
import { HerbalImageType } from '../entities/herbal-image.entity';

export class HerbalImageDto {
  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  alt?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(HerbalImageType)
  type?: HerbalImageType;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsString()
  herbalId: string;
}
export class HerbalImageResponseDto {
  @IsNumber()
  id: number;

  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  alt?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(HerbalImageType)
  type: HerbalImageType;

  @IsNumber()
  sortOrder: number;

  @IsBoolean()
  isActive: boolean;

  @IsNumber()
  herbalId: number;

  @IsDateString()
  createdAt: Date;

  @IsDateString()
  updatedAt: Date;
}

export class SortOrderDto {
  @IsNumber()
  id: number;

  @IsNumber()
  sortOrder: number;
} 