import { CreateFeedbackDto } from './create-feedback.dto';
import { IsOptional, IsEnum, IsString, IsNumber } from 'class-validator';
import { FeedbackStatus, FeedbackPriority } from '../entities/feedback.entity';

export class UpdateFeedbackDto extends CreateFeedbackDto {
  @IsOptional()
  @IsEnum(FeedbackStatus)
  status?: FeedbackStatus;

  @IsOptional()
  @IsString()
  adminResponse?: string;

  @IsOptional()
  @IsString()
  adminNotes?: string;

  @IsOptional()
  @IsNumber()
  assignedToId?: number;

  @IsOptional()
  @IsString()
  resolvedAt?: Date;
}
