import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { NOTIFICATION_ROLES, NOTIFICATION_ROOMS } from '../constants/notification.constants';
import { NotificationsGateway } from '../gateways/notifications.gateway';

@Injectable()
export class RoomGuard implements CanActivate {
  constructor(private readonly notificationsGateway: NotificationsGateway) {}

  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient();
    const data = context.switchToWs().getData();
    const room = data.room;
    const role = data.role;

    // Kiểm tra role có hợp lệ không
    if (!role || !Object.values(NOTIFICATION_ROLES).includes(role)) {
      return false;
    }

    // Kiểm tra room có hợp lệ không
    if (!room || !Object.values(NOTIFICATION_ROOMS).includes(room)) {
      return false;
    }

    // Kiểm tra quyền truy cập vào room
    switch (room) {
      case NOTIFICATION_ROOMS.CHEF_ROOM:
        return role === NOTIFICATION_ROLES.CHEF;
      case NOTIFICATION_ROOMS.WAITER_ROOM:
        return role === NOTIFICATION_ROLES.WAITER;
      case NOTIFICATION_ROOMS.MANAGER_ROOM:
        return role === NOTIFICATION_ROLES.MANAGER;
      default:
        return false;
    }
  }
} 