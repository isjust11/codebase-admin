import { IsString, IsNumber, IsOptional, IsBoolean, IsUrl, IsDate, Min } from 'class-validator';

export class CreateFoodItemDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

  @IsString()
  @IsOptional()
  foodCategoryId?: string;

  @IsString()
  @IsOptional()
  statusCategoryId?: string;

  @IsString()
  @IsOptional()
  unitCategoryId?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  preparationTime?: number;

  @IsNumber()
  @IsOptional()
  createBy?: number;

  @IsNumber()
  @IsOptional()
  orderCount?: number;

  @IsNumber()
  @IsOptional()
  discountPercent?: number;

  @IsDate()
  @IsOptional()
  discountStartTime?: Date;

  @IsDate()
  @IsOptional()
  discountEndTime?: Date;
}

export class UpdateFoodItemDto extends CreateFoodItemDto {} 