import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MESSAGE_METADATA } from '../decorators/message.decorator';
import { NOTIFICATION_MESSAGES } from '../constants/notification.constants';

@Injectable()
export class MessageGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const metadata = this.reflector.get<{ message: typeof NOTIFICATION_MESSAGES[keyof typeof NOTIFICATION_MESSAGES] }>(
      MESSAGE_METADATA,
      context.getHandler(),
    );

    if (!metadata) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Kiểm tra quyền truy cập dựa trên message
    // Ví dụ: chỉ cho phép admin gửi thông báo hệ thống
    if (metadata.message === NOTIFICATION_MESSAGES.SYSTEM_ERROR && user.role !== 'admin') {
      return false;
    }

    return true;
  }
} 