import { IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';

export class CreateProductDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsNumber()
  price: number;

  @IsString()
  thumbnail: string;

  @IsBoolean()
  isActive: boolean;

  @IsNumber()
  categoryId: number;
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsString()
  thumbnail?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  categoryId?: number;
}

export class ProductResponseDto {
  id: number;
  title: string;
  description: string;
  price: number;
  thumbnail: string;
  isActive: boolean;
  categoryId: number;
  createdAt: Date;
  updatedAt: Date;
} 