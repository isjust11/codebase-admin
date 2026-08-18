import { IsString, IsOptional, IsBoolean, IsArray, IsEnum, IsObject, ValidateIf } from 'class-validator';
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

  @ValidateIf((dto) => dto.editorMode !== TemplateEditorMode.VISUAL && !dto.layoutJson)
  @IsString()
  htmlContent?: string;

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

  @IsOptional()
  @IsObject()
  layoutJson?: Record<string, any>;

  @IsOptional()
  @IsString()
  editorMode?: string;

  @IsOptional()
  @IsObject()
  theme?: Record<string, any>;
}

export class TemplatePreviewDto {
  @IsOptional()
  @IsObject()
  sampleData?: Record<string, any>;

  @IsOptional()
  @IsString()
  htmlContent?: string;

  @IsOptional()
  @IsString()
  cssContent?: string;

  @IsOptional()
  @IsObject()
  layoutJson?: Record<string, any>;

  @IsOptional()
  @IsString()
  editorMode?: string;
}

export class TemplateRejectDto {
  @IsOptional()
  @IsString()
  note?: string;
}
