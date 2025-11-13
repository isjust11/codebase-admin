import { IsString, IsNumber, IsOptional, IsBoolean, IsNotEmpty, IsArray, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class FolkMedicineDiseaseDto {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsNotEmpty()
  @IsString()
  diseaseId: string;

  @IsNotEmpty()
  @IsString()
  folkMedicineId: string;

  @IsOptional()
  @IsString()
  diseaseName: string;

  @IsNotEmpty()
  @IsString()
  folkMedicineTitle: string;

  @IsOptional()
  @IsString()
  diseaseSlug: string;

  @IsOptional()
  @IsString()
  folkMedicineSlug: string;

  @IsOptional()
  @IsString()
  diseaseDescription: string;

  @IsOptional()
  @IsString()
  folkMedicineSummary: string;

  @IsOptional()
  @IsString()
  folkMedicineNotes: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
} 
