import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, IsUrl, Min, Max, IsEnum, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';
import { SliderType, SliderPosition } from '../entities/advertising-slider.entity';

export class CreateAdvertisingSliderDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsUrl()
  image?: string;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  images?: string[];

  @IsOptional()
  @IsUrl()
  link?: string;

  @IsEnum(SliderType)
  type: SliderType;

  @IsEnum(SliderPosition)
  position: SliderPosition;

  @IsOptional()
  @IsNumber()
  @Min(1)
  order?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  targetAudience?: string;

  @IsOptional()
  @IsString()
  conditions?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateAdvertisingSliderDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsUrl()
  image?: string;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  images?: string[];

  @IsOptional()
  @IsUrl()
  link?: string;

  @IsOptional()
  @IsEnum(SliderType)
  type?: SliderType;

  @IsOptional()
  @IsEnum(SliderPosition)
  position?: SliderPosition;

  @IsOptional()
  @IsNumber()
  @Min(1)
  order?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  targetAudience?: string;

  @IsOptional()
  @IsString()
  conditions?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class AdvertisingSliderFilterDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(SliderType)
  type?: SliderType;

  @IsOptional()
  @IsEnum(SliderPosition)
  position?: SliderPosition;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsString()
  createdById?: string;
} 