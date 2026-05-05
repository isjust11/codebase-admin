import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class GenerateBookCoverRequestDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  author: string;
}
