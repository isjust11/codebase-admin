import { IsString, IsOptional, IsBoolean, IsArray, IsDate } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsBoolean()
  @IsOptional()
  isAdmin?: boolean;

  @IsArray()
  @IsOptional()
  roleIds?: number[];

  @IsString()
  @IsOptional()
  platformId?: string;

  @IsString()
  @IsOptional()
  picture?: string;

  @IsBoolean()
  @IsOptional()
  isGoogleUser?: boolean;

  @IsBoolean()
  @IsOptional()
  isFacebookUser?: boolean;

  @IsString()
  @IsOptional()
  verificationToken?: string;

  @IsBoolean()
  @IsOptional()
  isEmailVerified?: boolean;

  @IsString()
  @IsOptional()
  password?: string;

  @IsDate()
  @IsOptional()
  lastLogin?: Date;


} 