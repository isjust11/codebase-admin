import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY, PERMISSION_ACTION_KEY } from '../decorators/require-permissions.decorator';
import { RoleService } from '../services/role.service';
import { PermissionService } from '../services/permission.service';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private roleService: RoleService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.roles) {
      return false;
    }

    // Kiểm tra permission theo action và resource (mới)
    const permissionAction = this.reflector.getAllAndOverride<any>(PERMISSION_ACTION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (permissionAction) {
      return await this.checkPermissionByAction(user, permissionAction);
    }

    // Kiểm tra permission theo code (cũ - tương thích ngược)
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiredPermissions) {
      return await this.checkPermissionByCode(user, requiredPermissions);
    }

    // Nếu không có permission nào được yêu cầu, cho phép truy cập
    return true;
  }

  private async checkPermissionByAction(user: any, permissionAction: any): Promise<boolean> {
    // Lấy role đầu tiên của user
    const role = await this.roleService.findById(user.roles[0].id);
    if (!role || role.isActive === false) {
      return false;
    }

    // Admin có tất cả quyền
    if (role.code === 'ADMIN') {
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
    const role = await this.roleService.findById(user.roles[0].id);
    if (!role || role.isActive === false) {
      return false;
    }

    if (role.code === 'ADMIN') {
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