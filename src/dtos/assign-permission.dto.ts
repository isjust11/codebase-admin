import { IsArray, IsOptional, IsString } from 'class-validator';

export class AssignPermissionDto {
  @IsArray()
  @IsString({ each: true })
  permissionIds: string[];
}

export class PermissionStatsDto {
  totalPermissions: number;
  assignedPermissions: number;
  uniqueResources: number;
  uniqueActions: number;
  resourceStats: {
    resource: string;
    total: number;
    assigned: number;
    percentage: number;
  }[];
} 