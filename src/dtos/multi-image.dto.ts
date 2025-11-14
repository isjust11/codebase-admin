import { IsString, IsOptional, IsNumber, IsBoolean, IsDateString, IsEnum } from 'class-validator';
import { HerbalImageType, ImageEntityType } from '../entities/multi-image.entity';

export class MultiImageDto {
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

  @IsEnum(ImageEntityType)
  entityType: ImageEntityType;

  @IsString()
  entityId: number;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  // Deprecated: Giữ lại để tương thích ngược, sẽ map sang entityId và entityType
  @IsOptional()
  @IsString()
  herbalId?: number;
}
export class MultiImageResponseDto {
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

  @IsEnum(ImageEntityType)
  entityType: ImageEntityType;

  @IsNumber()
  entityId: number;

  @IsNumber()
  sortOrder: number;

  @IsBoolean()
  isActive: boolean;

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