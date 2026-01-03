import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY, PERMISSION_ACTION_KEY } from '../decorators/require-permissions.decorator';
import { RoleService } from '../services/role.service';
import { RoleEnum } from 'src/enums/role.enum';

@Injectable()
export class PermissionGuard implements CanActivate {
  private readonly logger = new Logger(PermissionGuard.name);

  constructor(
    private reflector: Reflector,
    private roleService: RoleService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Kiểm tra nếu route là public
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      this.logger.debug('Route is public, skipping permission check');
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    this.logger.debug(`Checking permissions for user: ${JSON.stringify(user)}`);

    if (!user || !user.roles) {
      this.logger.warn('User or user.roles is missing');
      return false;
    }

    // Kiểm tra permission theo action và resource (mới)
    const permissionAction = this.reflector.getAllAndOverride<any>(PERMISSION_ACTION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (permissionAction) {
      this.logger.debug(`Required permission: ${JSON.stringify(permissionAction)}`);
      const hasPermission = await this.checkPermissionByAction(user, permissionAction);
      this.logger.debug(`Permission check result: ${hasPermission}`);
      return hasPermission;
    }

    // Kiểm tra permission theo code (cũ - tương thích ngược)
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiredPermissions) {
      this.logger.debug(`Required permissions (code): ${JSON.stringify(requiredPermissions)}`);
      const hasPermission = await this.checkPermissionByCode(user, requiredPermissions);
      this.logger.debug(`Permission check result: ${hasPermission}`);
      return hasPermission;
    }

    // Nếu không có permission nào được yêu cầu, cho phép truy cập
    this.logger.debug('No permission required, allowing access');
    return true;
  }

  private async checkPermissionByAction(user: any, permissionAction: any): Promise<boolean> {
    // Kiểm tra user có roles không
    if (!user.roles || user.roles.length === 0) {
      this.logger.warn('User has no roles');
      return false;
    }

    // Lấy role đầu tiên của user
    // user.roles là mảng số (number[]) từ JWT payload
    const roleId = typeof user.roles[0] === 'number' ? user.roles[0] : user.roles[0]?.id;
    
    this.logger.debug(`Extracted roleId: ${roleId} from user.roles: ${JSON.stringify(user.roles)}`);
    
    if (!roleId) {
      this.logger.warn('Could not extract roleId from user.roles');
      return false;
    }
    
    const role = await this.roleService.findById(roleId);
    
    if (!role) {
      this.logger.warn(`Role not found for roleId: ${roleId}`);
      return false;
    }
    
    if (role.isActive === false) {
      this.logger.warn(`Role is inactive: ${role.code}`);
      return false;
    }

    this.logger.debug(`User role: ${role.code}, permissions: ${JSON.stringify(role.permissions?.map(p => ({ action: p.action, resource: p.resource })))}`);

    // Admin có tất cả quyền
    if (role.code === RoleEnum.SUPPER_ADMIN || role.code === RoleEnum.ADMIN) {
      this.logger.debug('User is SUPER_ADMIN or ADMIN, granting access');
      return true;
    }

    // Kiểm tra nếu permissionAction là array
    if (Array.isArray(permissionAction)) {
      return permissionAction.some(permission => 
        this.hasPermission(role, permission.action, permission.resource)
      );
    }

    // Kiểm tra single permission
    return this.hasPermission(role, permissionAction.action, permissionAction.resource);
  }

  private async checkPermissionByCode(user: any, requiredPermissions: string[]): Promise<boolean> {
    // Kiểm tra user có roles không
    if (!user.roles || user.roles.length === 0) {
      return false;
    }

    // user.roles là mảng số (number[]) từ JWT payload
    const roleId = typeof user.roles[0] === 'number' ? user.roles[0] : user.roles[0]?.id;
    
    if (!roleId) {
      return false;
    }
    
    const role = await this.roleService.findById(roleId);
    if (!role || role.isActive === false) {
      return false;
    }

    if (role.code === RoleEnum.SUPPER_ADMIN || role.code === RoleEnum.ADMIN) {
      return true;
    }

    return requiredPermissions.some(permission => 
      role.permissions?.some(rolePermission => rolePermission.code === permission)
    );
  }

  private hasPermission(role: any, action: string, resource?: string): boolean {
    if (!role.permissions) {
      return false;
    }

    return role.permissions.some(permission => {
      const actionMatch = !action || permission.action === action;
      const resourceMatch = !resource || permission.resource === resource;
      return actionMatch && resourceMatch && permission.isActive;
    });
  }
} 