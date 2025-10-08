import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { Article } from 'src/entities/article.entity';

export class ArticleDto {
  @IsOptional()
  @IsNumber()
  id: number;

  @IsString()
  title: string | undefined;

  @IsOptional()
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
  createdBy?: any;

  @IsOptional()
  updatedBy?: any;

  @IsOptional()
  statusId?: any;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  dataSourceId?: any;

  @IsOptional()
  @IsNumber()
  view?: number;

  @IsOptional()
  @IsNumber()
  like?: number;
} 