import { IsString, IsOptional, IsEnum, IsBoolean, IsNumber, IsArray, IsJSON } from 'class-validator';
import { SkillType } from '../enums/skill-type.enum';
import { QuestionType } from 'src/enums/question-type.enum';

export class CreateQuestionDto {
  @IsString()
  id:string;
  
  @IsString()
  content: string;

  @IsEnum(SkillType)
  skill: SkillType;

  @IsOptional()
  @IsEnum(QuestionType)
  type?: QuestionType;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @IsOptional()
  @IsJSON()
  answer?: string;

  @IsOptional()
  @IsString()
  explanation?: string;
}

export class QuestionDto {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsString()
  content: string;

  @IsEnum(SkillType)
  skill: SkillType;

  @IsOptional()
  @IsEnum(QuestionType)
  type?: QuestionType;

  @IsOptional()
  options?: string[];

  @IsOptional()
  @IsString()
  answer?: string;

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
} 