import { IsString, IsNumber, IsEnum, IsBoolean } from 'class-validator';
import { Optional } from '@nestjs/common';
import { IconType } from 'src/enums/icon-type.enum';

export class FeatureDto {
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

  @IsNumber()
  @Optional()
  sortOrder?:number;

  @IsEnum(IconType)
  @Optional()
  iconType: IconType;

  @IsString()
  @Optional()
  featureTypeId: string;

  @Optional()
  @IsNumber()
  iconSize: number;
    
  className: string;
}