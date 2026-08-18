import { IsString, IsOptional, IsEnum, IsObject, IsDateString } from 'class-validator';
import { EventStatus } from '../enums/event-status.enum';
import { TemplateType } from '../enums/template-type.enum';

export class EventDto {
  @IsOptional()
  id?: number;

  @IsString()
  title: string;

  @IsOptional()
  @IsEnum(TemplateType)
  type?: TemplateType;

  @IsOptional()
  templateId?: any;

  @IsOptional()
  @IsDateString()
  eventDate?: string;

  @IsOptional()
  @IsString()
  venue?: string;

  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @IsOptional()
  @IsObject()
  eventData?: Record<string, any>;

  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;
}

export class EventDataDto {
  @IsObject()
  eventData: Record<string, any>;
}

export class AssignTemplateDto {
  templateId: any;
}
