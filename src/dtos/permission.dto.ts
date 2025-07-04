import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  action?: string;

  @IsString()
  @IsOptional()
  resource?: string;

  @IsNumber()
  @IsOptional()
  featureId?: number;
}

export class UpdatePermissionDto extends CreatePermissionDto {} 