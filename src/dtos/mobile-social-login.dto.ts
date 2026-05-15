import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class MobileSocialLoginDto {
  @IsString()
  @IsNotEmpty()
  platformId: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  picture?: string;

  @IsString()
  @IsNotEmpty()
  platform: 'google' | 'facebook' | 'apple';

  @IsString()
  @IsNotEmpty()
  accessToken: string;

  /**
   * Facebook only:
   * - 'classic' → dùng Graph API (user cho phép tracking)
   * - 'limited' → dùng JWKS/OIDC (user từ chối tracking, iOS 14.5+)
   */
  @IsString()
  @IsOptional()
  @IsIn(['classic', 'limited'])
  tokenType?: 'classic' | 'limited';

  /** Facebook Limited Login only — bắt buộc khi tokenType = 'limited' */
  @IsString()
  @IsOptional()
  nonce?: string;

  @IsString()
  @IsOptional()
  fcmToken?: string;

  @IsString()
  @IsOptional()
  deviceId?: string;
}
