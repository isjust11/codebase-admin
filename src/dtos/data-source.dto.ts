import { IsString, IsNumber, IsOptional, IsBoolean, IsNotEmpty, IsEnum, IsDateString } from 'class-validator';
import { DataSourceType } from '../entities/data-source.entity';

export class DataSourceDto {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsEnum(DataSourceType)
  type: DataSourceType;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsString()
  publisher?: string;

  @IsOptional()
  publishDate?: string | null;

  @IsOptional()
  @IsString()
  isbn?: string;

  @IsOptional()
  @IsString()
  doi?: string;

  @IsOptional()
  @IsString()
  citation?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}