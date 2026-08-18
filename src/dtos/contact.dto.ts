import { IsString, IsOptional, IsArray, IsEmail } from 'class-validator';

export class ContactDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class ImportContactsDto {
  @IsArray()
  contacts: ContactDto[];
}
