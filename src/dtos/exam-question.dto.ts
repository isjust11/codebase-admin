import { IsNumber, IsOptional } from 'class-validator';

export class ExamQuestionDto {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsNumber()
  examId: number;

  @IsNumber()
  questionId: number;

  @IsOptional()
  @IsNumber()
  order?: number;
} 