import { IsNotEmpty, IsString } from "class-validator";

export class UpdateProfileDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsString()
  @IsNotEmpty()
  fullName: string;

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
  birthDate: string;

  @IsString()
  @IsNotEmpty()
  facebookLink: string;

  @IsString()
  @IsNotEmpty()
  instagramLink: string;

  @IsString()
  @IsNotEmpty()
  twitterLink: string;

  @IsString()
  @IsNotEmpty()
  linkedinLink: string;
}
