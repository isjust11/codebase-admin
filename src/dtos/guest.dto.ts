import { IsString, IsOptional, IsEnum, IsObject, IsNumber, IsArray, IsEmail, IsBoolean } from 'class-validator';
import { RsvpStatus } from '../enums/rsvp-status.enum';
import { GuestSource } from '../enums/guest-source.enum';

export class GuestDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  group?: string;

  @IsOptional()
  @IsEnum(GuestSource)
  source?: GuestSource;

  @IsOptional()
  @IsObject()
  extraData?: Record<string, any>;
}

export class ImportGuestsDto {
  @IsArray()
  guests: GuestDto[];
}

export class RsvpDto {
  @IsEnum(RsvpStatus)
  status: RsvpStatus;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsNumber()
  plusOnes?: number;
}

/** Open RSVP from public invite page (/invite/:slug) — no guest token required. */
export class PublicEventRsvpDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsBoolean()
  attending?: boolean;

  @IsOptional()
  @IsEnum(RsvpStatus)
  status?: RsvpStatus;

  @IsOptional()
  @IsNumber()
  guests?: number;

  @IsOptional()
  @IsNumber()
  plusOnes?: number;

  @IsOptional()
  @IsString()
  note?: string;
}
