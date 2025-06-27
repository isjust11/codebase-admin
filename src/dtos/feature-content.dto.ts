import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class FeatureContentDto {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsNumber()
  featureId: number;

  @IsString()
  type: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
} 