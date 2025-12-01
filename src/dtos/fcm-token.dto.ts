import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class FcmTokenDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  platform: string;

  @IsString()
  @IsOptional()
  deviceId?: string;

  @IsString()
  @IsOptional()
  app_version?: string;
}