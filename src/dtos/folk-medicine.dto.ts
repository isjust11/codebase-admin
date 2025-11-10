import { IsString, IsNumber, IsOptional, IsBoolean, IsNotEmpty, IsArray, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

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

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FolkMedicineComponentDto)
  components?: FolkMedicineComponentDto[];
} 

export class FolkMedicineComponentDto {
  @IsNotEmpty()
  @IsString()
  herbalId: string; // base64-encoded id

  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsString()
  unitCategoryId?: string; // base64-encoded category id

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
} 