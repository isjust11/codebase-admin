import { IsString, IsNumber, IsOptional, IsBoolean, IsNotEmpty, IsDefined } from 'class-validator';

export class FolkMedicineDto {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  ingredients?: string;

  @IsOptional()
  @IsString()
  preparation?: string;

  @IsOptional()
  @IsString()
  usage?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  thumbnail?: string;

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
  @IsBoolean()
  isActive?: boolean;
} 