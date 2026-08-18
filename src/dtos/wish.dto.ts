import { IsOptional, IsString } from 'class-validator';

export class CreateWishDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsString()
  message: string;
}
