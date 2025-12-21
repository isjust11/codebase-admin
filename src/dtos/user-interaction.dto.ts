import { IsEnum, IsNumber, IsOptional, IsString, IsDecimal, IsObject, Min, Max } from 'class-validator';
import { InteractionType } from 'src/enums/interaction-type.enum';
import { InteractionTarget } from 'src/enums/interaction-target.enum';

export class CreateUserInteractionDto {
  @IsEnum(InteractionType)
  interactionType: InteractionType;

  @IsEnum(InteractionTarget)
  targetType: InteractionTarget;

  @IsNumber()
  targetId: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsString()
  sharePlatform?: string;

  @IsOptional()
  @IsObject()
  metadata?: any;
}

export class UpdateUserInteractionDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsString()
  sharePlatform?: string;

  @IsOptional()
  @IsObject()
  metadata?: any;
}

export class UserInteractionResponseDto {
  id: number;
  userId: number;
  interactionType: InteractionType;
  targetType: InteractionTarget;
  targetId: number;
  rating?: number;
  comment?: string;
  sharePlatform?: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export class InteractionStatsResponseDto {
  targetType: InteractionTarget;
  targetId: number;
  likeCount: number;
  dislikeCount: number;
  bookmarkCount: number;
  shareCount: number;
  viewCount: number;
  commentCount: number;
  rateCount: number;
  followCount: number;
  averageRating: number;
  createdAt: Date;
  updatedAt: Date;
}

export class UserInteractionQueryDto {
  @IsOptional()
  @IsEnum(InteractionType)
  interactionType?: InteractionType;

  @IsOptional()
  @IsEnum(InteractionTarget)
  targetType?: InteractionTarget;

  @IsOptional()
  @IsNumber()
  targetId?: number;

  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  limit?: number = 10;
}
