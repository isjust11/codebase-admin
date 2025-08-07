import { IsString, IsOptional, IsBoolean, IsArray, IsUrl, IsEnum, IsUUID, IsEmail } from 'class-validator';
import { ComplaintType, ComplaintStatus, ComplaintPriority } from '../entities/product-complaint.entity';

export class CreateProductComplaintDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsEnum(ComplaintType)
  type: ComplaintType;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  images?: string[];

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  attachments?: string[];

  @IsOptional()
  @IsBoolean()
  isUrgent?: boolean;

  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsUUID()
  productId: string;
}

export class UpdateProductComplaintDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ComplaintType)
  type?: ComplaintType;

  @IsOptional()
  @IsEnum(ComplaintStatus)
  status?: ComplaintStatus;

  @IsOptional()
  @IsEnum(ComplaintPriority)
  priority?: ComplaintPriority;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  images?: string[];

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  attachments?: string[];

  @IsOptional()
  @IsString()
  adminNotes?: string;

  @IsOptional()
  @IsString()
  resolution?: string;

  @IsOptional()
  @IsBoolean()
  isUrgent?: boolean;

  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsUUID()
  assignedToId?: string;
}

export class AssignComplaintDto {
  @IsUUID()
  assignedToId: string;
}

export class ResolveComplaintDto {
  @IsString()
  resolution: string;
}

export class ProductComplaintFilterDto {
  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @IsOptional()
  @IsEnum(ComplaintType)
  type?: ComplaintType;

  @IsOptional()
  @IsEnum(ComplaintStatus)
  status?: ComplaintStatus;

  @IsOptional()
  @IsEnum(ComplaintPriority)
  priority?: ComplaintPriority;

  @IsOptional()
  @IsBoolean()
  isUrgent?: boolean;

  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'priority' | 'status';

  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC';
} 