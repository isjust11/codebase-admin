import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

const ALLOWED_FORMATS = ['pdf', 'epub', 'mobi', 'azw', 'azw3', 'fb2', 'other'] as const;

export class AddBookFormatDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  fileSize?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  totalPages?: number;

  @ApiProperty({ required: false, enum: ALLOWED_FORMATS })
  @IsString()
  @IsIn(ALLOWED_FORMATS as unknown as string[])
  @IsOptional()
  format?: string;
}

export class CreateBookDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  author: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  coverImageUrl?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  totalPages?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  isbn?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  publisher?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  publishedDate?: string;

  @ApiProperty({ required: false, default: 'vi' })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiProperty({ required: false, default: true })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  categoryId?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  fileSize?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  createById?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  countryCode?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  region?: string;

  
}

export class UpdateBookDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  author?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  coverImageUrl?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  fileUrl?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  totalPages?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  isbn?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  publisher?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  publishedDate?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  categoryId?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  fileSize?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  createById?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  statusId?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  countryCode?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  region?: string;
}

