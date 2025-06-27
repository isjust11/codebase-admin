import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { NOTIFICATION_METADATA } from '../decorators/notification.decorator';
import { NotificationType, NotificationPriority } from '../enums/notification.enum';

@Injectable()
export class NotificationGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const metadata = this.reflector.get<{ type: NotificationType; priority: NotificationPriority }>(
      NOTIFICATION_METADATA,
      context.getHandler(),
    );

    if (!metadata) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Kiểm tra quyền truy cập dựa trên metadata
    // Ví dụ: chỉ cho phép admin gửi thông báo hệ thống
    if (metadata.type === NotificationType.SYSTEM && user.role !== 'admin') {
      return false;
    }

    // Kiểm tra độ ưu tiên
    if (metadata.priority === NotificationPriority.URGENT && user.role !== 'admin') {
      return false;
    }

    return true;
  }
} 