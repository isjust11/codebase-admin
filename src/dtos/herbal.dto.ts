import { IsString, IsOptional, IsNumber, IsBoolean, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateHerbalDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  scientificName?: string;

  @IsOptional()
  @IsString()
  commonNames?: string;

  @IsOptional()
  @IsString()
  family?: string;

  @IsOptional()
  @IsString()
  partsUsed?: string;

  @IsOptional()
  @IsString()
  activeCompounds?: string;

  @IsOptional()
  @IsString()
  medicinalProperties?: string;

  @IsOptional()
  @IsString()
  preparationMethods?: string;

  @IsOptional()
  @IsString()
  dosage?: string;

  @IsOptional()
  @IsString()
  contraindications?: string;

  @IsOptional()
  @IsString()
  sideEffects?: string;

  @IsOptional()
  @IsString()
  thumbnail?: string;

  @IsOptional()
  @IsString()
  authorId?: number;

  @IsOptional()
  @IsString()
  categoryId?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateHerbalDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  scientificName?: string;

  @IsOptional()
  @IsString()
  commonNames?: string;

  @IsOptional()
  @IsString()
  family?: string;

  @IsOptional()
  @IsString()
  partsUsed?: string;

  @IsOptional()
  @IsString()
  activeCompounds?: string;

  @IsOptional()
  @IsString()
  medicinalProperties?: string;

  @IsOptional()
  @IsString()
  preparationMethods?: string;

  @IsOptional()
  @IsString()
  dosage?: string;

  @IsOptional()
  @IsString()
  contraindications?: string;

  @IsOptional()
  @IsString()
  sideEffects?: string;

  @IsOptional()
  @IsString()
  thumbnail?: string;

  @IsOptional()
  @IsString()
  authorId?: number;

  @IsOptional()
  @IsString()
  categoryId?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class HerbalResponseDto {
  @IsNumber()
  id: number;

  @IsString()
  title: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  scientificName?: string;

  @IsOptional()
  @IsString()
  commonNames?: string;

  @IsOptional()
  @IsString()
  family?: string;

  @IsOptional()
  @IsString()
  partsUsed?: string;

  @IsOptional()
  @IsString()
  activeCompounds?: string;

  @IsOptional()
  @IsString()
  medicinalProperties?: string;

  @IsOptional()
  @IsString()
  preparationMethods?: string;

  @IsOptional()
  @IsString()
  dosage?: string;

  @IsOptional()
  @IsString()
  contraindications?: string;

  @IsOptional()
  @IsString()
  sideEffects?: string;

  @IsOptional()
  @IsString()
  thumbnail?: string;

  @IsNumber()
  viewCount: number;

  @IsNumber()
  likeCount: number;

  @IsOptional()
  @IsString()
  authorId?: string;

  @IsOptional()
  category?: any;

  @IsOptional()
  @IsString()
  categoryId?: number;

  @IsBoolean()
  isActive: boolean;

  @IsDateString()
  createdAt: Date;

  @IsDateString()
  updatedAt: Date;
} 