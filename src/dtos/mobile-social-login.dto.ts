import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';

export class MobileSocialLoginDto {
  @IsString()
  @IsNotEmpty()
  platformId: string; // ID từ Google/Facebook

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsOptional()
  picture?: string; // URL ảnh đại diện

  @IsString()
  @IsNotEmpty()
  platform: 'google' | 'facebook'; // Loại platform

  @IsString()
  @IsNotEmpty()
  accessToken: string; // Access token từ platform (required for verification)
}
