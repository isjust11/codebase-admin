import { IsString, IsNumber, IsEnum, IsBoolean, IsOptional } from 'class-validator';
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
  @Optional()
  parentId?: string;

  @IsBoolean()
  isActive: boolean;

  @Optional()
  sortOrder?: any;

  @IsEnum(IconType)
  @Optional()
  iconType: IconType;

  @IsString()
  @Optional()
  featureTypeId: string;

  @Optional()
  @IsNumber()
  iconSize: any;

  @Optional()
  className: string;
}