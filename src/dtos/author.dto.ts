import { IsString, IsOptional, IsNumber, IsBoolean, IsDateString, IsArray } from 'class-validator';

export class AuthorDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  alias?: string;

  @IsOptional()
  @IsString()
  biography?: string;

  @IsOptional()
  @IsString()
  career?: string;

  @IsOptional()
  @IsString()
  achievements?: string;

  @IsOptional()
  @IsString()
  contributions?: string;

  @IsOptional()
  @IsString()
  works?: string;

  @IsOptional()
  @IsString()
  philosophy?: string;

  @IsOptional()
  @IsString()
  legacy?: string;

  @IsOptional()
  @IsString()
  birthDate?: string;

  @IsOptional()
  @IsString()
  deathDate?: string;

  @IsOptional()
  @IsString()
  birthPlace?: string;

  @IsOptional()
  @IsString()
  deathPlace?: string;

  @IsOptional()
  @IsString()
  era?: string;

  @IsOptional()
  @IsString()
  dynasty?: string;

  @IsOptional()
  @IsString()
  specialty?: string;

  @IsOptional()
  @IsString()
  teacher?: string;

  @IsOptional()
  @IsString()
  students?: string;

  @IsOptional()
  @IsString()
  portrait?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  galleryImages?: string[];

  @IsOptional()
  @IsString()
  quotes?: string;

  @IsOptional()
  @IsString()
  anecdotes?: string;

  @IsOptional()
  @IsString()
  honors?: string;

  @IsOptional()
  @IsString()
  memorials?: string;

  @IsOptional()
  @IsString()
  references?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  dataSourceId?: any;
}
export class AuthorResponseDto {
  @IsNumber()
  id: number;

  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  alias?: string;

  @IsOptional()
  @IsString()
  biography?: string;

  @IsOptional()
  @IsString()
  career?: string;

  @IsOptional()
  @IsString()
  achievements?: string;

  @IsOptional()
  @IsString()
  contributions?: string;

  @IsOptional()
  @IsString()
  works?: string;

  @IsOptional()
  @IsString()
  philosophy?: string;

  @IsOptional()
  @IsString()
  legacy?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: Date;

  @IsOptional()
  @IsDateString()
  deathDate?: Date;

  @IsOptional()
  @IsString()
  birthPlace?: string;

  @IsOptional()
  @IsString()
  deathPlace?: string;

  @IsOptional()
  @IsString()
  era?: string;

  @IsOptional()
  @IsString()
  dynasty?: string;

  @IsOptional()
  @IsString()
  specialty?: string;

  @IsOptional()
  @IsString()
  teacher?: string;

  @IsOptional()
  @IsString()
  students?: string;

  @IsOptional()
  @IsString()
  portrait?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsOptional()
  avatarFile?: any;

  @IsOptional()
  coverImageFile?: any;

  @IsOptional()
  galleryImagesFile?: any[];

  @IsOptional()
  portraitFile?: any;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  galleryImages?: string[];

  @IsOptional()
  @IsString()
  quotes?: string;

  @IsOptional()
  @IsString()
  anecdotes?: string;

  @IsOptional()
  @IsString()
  honors?: string;

  @IsOptional()
  @IsString()
  memorials?: string;

  @IsOptional()
  @IsString()
  references?: string;

  @IsNumber()
  viewCount: number;

  @IsNumber()
  likeCount: number;

  @IsBoolean()
  isActive: boolean;

  @IsOptional()
  herbals?: any[];

  @IsOptional()
  folkMedicines?: any[];

  @IsDateString()
  createdAt: Date;

  @IsDateString()
  updatedAt: Date;

  @IsOptional()
  dataSourceId?: any;
} 