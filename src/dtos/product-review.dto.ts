import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, IsUrl, Min, Max, IsUUID } from 'class-validator';

export class CreateProductReviewDto {
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  images?: string[];

  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;

  @IsUUID()
  productId: string;
}

export class UpdateProductReviewDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  images?: string[];

  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;
}

export class ReplyProductReviewDto {
  @IsString()
  reply: string;
}

export class ProductReviewFilterDto {
  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @IsOptional()
  @IsBoolean()
  isHelpful?: boolean;

  @IsOptional()
  @IsString()
  sortBy?: 'rating' | 'createdAt' | 'helpfulCount';

  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC';
} 