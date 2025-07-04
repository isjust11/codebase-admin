import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
export const PERMISSION_ACTION_KEY = 'permission_action';

// Decorator cũ để tương thích ngược
export const RequirePermissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);

// Decorator mới để phân quyền theo action và resource
export const RequirePermission = (action: string, resource?: string) => 
  SetMetadata(PERMISSION_ACTION_KEY, { action, resource });

// Decorator để yêu cầu nhiều permission
export const RequirePermissionsAction = (...permissions: { action: string; resource?: string }[]) => 
  SetMetadata(PERMISSION_ACTION_KEY, permissions); 