import { IsString, IsOptional, IsBoolean, IsNotEmpty, IsArray } from 'class-validator';

export class CreateDiseaseDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  symptoms?: string;

  @IsOptional()
  @IsString()
  causes?: string;

  @IsOptional()
  @IsString()
  prevention?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateDiseaseDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  symptoms?: string;

  @IsOptional()
  @IsString()
  causes?: string;

  @IsOptional()
  @IsString()
  prevention?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AddDiseasesToFolkMedicineDto {
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  diseaseIds: string[];
}

export class RemoveDiseasesFromFolkMedicineDto {
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  diseaseIds: string[];
}

