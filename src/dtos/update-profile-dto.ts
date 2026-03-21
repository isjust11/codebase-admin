import { IsNotEmpty, IsString, Matches } from "class-validator";

export class UpdateProfileDto {

  @IsString()
  fullName: string;

  @IsString()
  picture: string;

  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsString()
  address: string;

  @IsString()
  @Matches(/^\d{2}\/\d{2}\/\d{4}$/, {
    message: 'birthDate must be in format dd/MM/yyyy'
  })
  birthDate: string;

  @IsString()
  facebookLink: string;

  @IsString()
  instagramLink: string;

  @IsString()
  twitterLink: string;

  @IsString()
  linkedinLink: string;
}
