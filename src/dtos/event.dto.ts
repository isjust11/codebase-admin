import {
  IsString,
  IsOptional,
  IsEnum,
  IsObject,
  IsDateString,
  IsUrl,
  IsNumber,
  IsArray,
  ValidateNested,
  IsInt,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EventStatus } from '../enums/event-status.enum';
import { TemplateType } from '../enums/template-type.enum';
import { EventMediaType } from '../entities/event-media.entity';

export class EventDto {
  @IsOptional()
  id?: number;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  slug?: string;

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

export class UpdateCustomizationDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsDateString()
  eventDate?: string;

  @IsOptional()
  @IsString()
  venue?: string;

  /**
   * Scalar customization fields: names, colors, messages, etc.
   * Media assets (images/videos) are managed separately via /events/:id/media
   */
  @IsOptional()
  @IsObject()
  eventData?: Record<string, any>;
}

// ---------------------------------------------------------------------------
// Media DTOs
// ---------------------------------------------------------------------------

/** Represents a single media item within a group (e.g. one photo in the album) */
export class EventMediaItemDto {
  /** Publicly accessible URL of the media file */
  @IsString()
  @IsUrl({ require_tld: false })
  url: string;

  /** Optional caption / alt text */
  @IsOptional()
  @IsString()
  @MaxLength(512)
  caption?: string;

  /** Media type: image | video | audio */
  @IsOptional()
  @IsEnum(EventMediaType)
  type?: EventMediaType;

  /** MIME type, e.g. "image/jpeg", "video/mp4" */
  @IsOptional()
  @IsString()
  @MaxLength(128)
  mimeType?: string;

  /** File size in bytes */
  @IsOptional()
  @IsInt()
  @Min(0)
  fileSize?: number;

  /** Width in pixels */
  @IsOptional()
  @IsInt()
  @Min(0)
  width?: number;

  /** Height in pixels */
  @IsOptional()
  @IsInt()
  @Min(0)
  height?: number;

  /** Display order within the group (lower = shown first) */
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

/**
 * Payload for PUT /events/:id/media
 * Replaces all existing items in the specified group with the new list.
 */
export class UpsertEventMediaDto {
  /**
   * Logical group key, e.g. "album", "highlight_video", "moments"
   * All existing items in this group will be replaced by the new items list.
   */
  @IsString()
  @MaxLength(100)
  groupKey: string;

  /** Ordered list of media items to store for this group */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventMediaItemDto)
  items: EventMediaItemDto[];
}

