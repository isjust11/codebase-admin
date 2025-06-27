import { IsString, IsOptional, IsArray, IsBoolean } from 'class-validator';

export class RoleDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsArray()
  @IsOptional()
  permissionIds?: number[];

  @IsArray()
  @IsOptional()
  features?: string[];
}
