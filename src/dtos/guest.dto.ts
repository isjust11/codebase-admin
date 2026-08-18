import { IsString, IsOptional, IsEnum, IsObject, IsNumber, IsArray, IsEmail } from 'class-validator';
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
