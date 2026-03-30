import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';

export class MobileSocialLoginDto {
  @IsString()
  @IsNotEmpty()
  platformId: string; // ID từ Google/Facebook

  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  picture?: string; // URL ảnh đại diện

  @IsString()
  @IsNotEmpty()
  platform: 'google' | 'facebook' | 'apple'; // Loại platform

  @IsString()
  @IsNotEmpty()
  accessToken: string; // Access token từ platform (required for verification)

  @IsString()
  @IsOptional()
  fcmToken?: string;

  @IsString()
  @IsOptional()
  deviceId?: string;
}
