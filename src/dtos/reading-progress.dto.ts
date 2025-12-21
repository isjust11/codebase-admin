import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class SaveProgressDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  bookId: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  currentPage: number;
}

export class UpdateReadingTimeDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  bookId: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  minutes: number;
}

