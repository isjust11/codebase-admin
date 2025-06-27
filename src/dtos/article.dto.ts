import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class ArticleDto {
  @IsOptional()
  @IsNumber()
  id?: number;

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
  thumbnail?: string;

  @IsOptional()
  @IsNumber()
  authorId?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
} 