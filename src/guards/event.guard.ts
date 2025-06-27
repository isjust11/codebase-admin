import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EVENT_METADATA } from '../decorators/event.decorator';
import { NOTIFICATION_EVENTS } from '../constants/notification.constants';

@Injectable()
export class EventGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const metadata = this.reflector.get<{ event: typeof NOTIFICATION_EVENTS[keyof typeof NOTIFICATION_EVENTS] }>(
      EVENT_METADATA,
      context.getHandler(),
    );

    if (!metadata) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Kiểm tra quyền truy cập dựa trên sự kiện
    // Ví dụ: chỉ cho phép admin gửi thông báo hệ thống
    if (metadata.event === NOTIFICATION_EVENTS.SYSTEM_ERROR && user.role !== 'admin') {
      return false;
    }

    return true;
  }
} 