import { ValidateNested, IsString, IsOptional, IsBoolean, IsArray, IsEnum, IsObject, ValidateIf } from 'class-validator';
import { TemplateType } from '../enums/template-type.enum';
import { TemplateEditorMode } from '../enums/template-editor-mode.enum';

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


  @IsOptional()
  @IsArray()
  variablesSchema?: TemplateVariableDto[];

  @IsOptional()
  @IsObject()
  data?: Record<string, ConfigurableFieldDto | any>;

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


  @IsOptional()
  @IsObject()
  theme?: Record<string, any>;
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

import { Type } from 'class-transformer';

export class TemplateConfigDto {
  @IsString() @IsOptional() display?: string;
  @IsString() @IsOptional() color?: string;
  @IsString() @IsOptional() font?: string;
  @IsString() @IsOptional() size?: string;
}

export class ConfigurableFieldDto {
  @IsString() type: string;
  @IsOptional() defaul?: any;
  @IsOptional() value?: any;
  @IsObject() @IsOptional() @ValidateNested() @Type(() => TemplateConfigDto) config?: TemplateConfigDto;
}
