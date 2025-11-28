import { IsString, IsOptional, IsBoolean, IsNotEmpty, IsArray, IsNumber } from 'class-validator';

export class DiseaseDto {
  @IsOptional()
  @IsNumber()
  id?: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  symptoms?: string;

  @IsOptional()
  @IsString()
  causes?: string;

  @IsOptional()
  @IsString()
  prevention?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imagePaths?: string[];

  @IsOptional()
  @IsString()
  authorId?: any;

  @IsOptional()
  @IsString()
  categoryId?: any;

  @IsOptional()
  @IsString()
  dataSourceId?: any;

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsString()
  summary?: string;
}