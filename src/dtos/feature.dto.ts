import { IsString, IsNumber, IsEnum, IsBoolean, IsOptional, IsArray } from 'class-validator';
import { Optional } from '@nestjs/common';
import { IconType } from 'src/enums/icon-type.enum';

export class FeatureDto {
  @IsOptional()
  @IsString()
  id: string;

  @IsString()
  icon: string;

  @IsString()
  label: string;

  @IsString()
  link: string;

  @IsString()
  @IsOptional()
  parentId?: string;

  @IsBoolean()
  isActive: boolean;

  @IsOptional()
  sortOrder?: any;

  @IsEnum(IconType)
@IsOptional()
  iconType: IconType;

  @IsString()
  @IsOptional()
  featureTypeId: string;

  @IsOptional()
  @IsNumber()
  iconSize: any;

  @IsString()
  @IsOptional()
  className: string;

  @IsOptional()
  @IsArray()
  roles: string[];
}