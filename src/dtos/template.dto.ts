import { IsString, IsOptional, IsBoolean, IsArray, IsEnum, IsObject } from 'class-validator';
import { TemplateType } from '../enums/template-type.enum';

export class TemplateVariableDto {
  @IsString()
  key: string;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  scope?: string;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  defaultValue?: any;
}

export class TemplateDto {
  @IsOptional()
  id?: number;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsEnum(TemplateType)
  type?: TemplateType;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  htmlContent: string;

  @IsOptional()
  @IsString()
  cssContent?: string;

  @IsOptional()
  @IsArray()
  variablesSchema?: TemplateVariableDto[];

  @IsOptional()
  categoryId?: any;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;

  @IsOptional()
  createdBy?: any;
}

export class TemplatePreviewDto {
  @IsOptional()
  @IsObject()
  sampleData?: Record<string, any>;
}

export class TemplateRejectDto {
  @IsOptional()
  @IsString()
  note?: string;
}
