import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  Min,
} from 'class-validator';
import { SubscriptionPlanEnum } from 'src/enums/subscription-plan.enum';

export class CreateSubscriptionPlanDto {
  @IsEnum(SubscriptionPlanEnum)
  code: SubscriptionPlanEnum;

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
