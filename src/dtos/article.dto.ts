import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { Article } from 'src/entities/article.entity';

export class ArticleDto {
  @IsOptional()
  @IsNumber()
  id: number;

  @IsString()
  title: string | undefined;

  @IsString()
  slug: string | undefined;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  thumbnail?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;


  @IsOptional()
  @IsNumber()
  createdBy?: number;

  @IsOptional()
  @IsNumber()
  updatedBy?: number;

  @IsOptional()
  @IsNumber()
  statusId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
} 