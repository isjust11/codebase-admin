import { IsString, IsOptional, IsBoolean, IsArray } from 'class-validator';
import { Role } from 'src/entities/role.entity';

export class LoginDto {
  @IsString()
  username: string;

  @IsString()
  password: string;
}
export enum RegisterCode{
  AccountValidated = 'account_validated',
  ExistUsernameNotVerified = 'exist_username_not_verified',
  ExistUsernameVerified = 'exist_username_verified',
  ExistEmail = 'exist_email',
  AccountIsExist = 'account_is_exist',
  Ok = 'ok',
}
export class RegisterResultDto{
  code: RegisterCode;
  message: string;
  data: any;
}

export class RegisterDto {
  @IsString()
  username: string;

  @IsString()
  password: string;

  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  email: string;

  @IsBoolean()
  @IsOptional()
  isAdmin?: boolean;

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

  @IsArray()
  @IsOptional()
  roleIds?: number[];

  @IsBoolean()
  @IsOptional()
  isAppleUser?: boolean;
  
  @IsBoolean()
  @IsOptional()
  isWebsiteUser?: boolean;
}

export class ResendEmailDto {
  @IsString()
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  password: string;
}

export class JwtPayload {
  id: number;
  username: string;
  sub: number;
  picture: string;
  email: string;
  fullName: string;
  platformId: string;
  isFacebookUser: boolean;
  isGoogleUser: boolean;
  isAdmin: boolean;
  roles: Role[];
} 