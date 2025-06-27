import { IsNumber, IsOptional, IsString, IsBoolean } from 'class-validator';

export class UserAnswerDto {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsNumber()
  userExamId: number;

  @IsNumber()
  questionId: number;

  @IsOptional()
  @IsString()
  answer?: string;

  @IsOptional()
  @IsBoolean()
  isCorrect?: boolean;
} 