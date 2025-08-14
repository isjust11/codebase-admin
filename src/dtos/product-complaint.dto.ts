import { IsString, IsOptional } from 'class-validator';

export class CreateProductComplaintDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  status: string;
}

export class UpdateProductComplaintDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class ProductComplaintResponseDto {
  id: number;
  title: string;
  description: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
} 