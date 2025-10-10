import { IsNotEmpty, IsString } from "class-validator";

export class UpdateProfileDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  picture: string;

  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  city: string;
}
