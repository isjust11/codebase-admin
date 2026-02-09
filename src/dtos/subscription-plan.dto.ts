import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  Min,
} from 'class-validator';
import { PlanCode } from '../entities/subscription-plan.entity';

export class CreateSubscriptionPlanDto {
  @IsEnum(PlanCode)
  code: PlanCode;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  storageLimitBytes?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  ttsLimitPerPeriod?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  convertLimitPerPeriod?: number;

  @IsOptional()
  @IsString()
  periodType?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateSubscriptionPlanDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  storageLimitBytes?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  ttsLimitPerPeriod?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  convertLimitPerPeriod?: number;

  @IsOptional()
  @IsString()
  periodType?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
