import { IsNotEmpty, IsString, Matches } from "class-validator";

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
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{2}\/\d{2}\/\d{4}$/, {
    message: 'birthDate must be in format dd/MM/yyyy'
  })
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
