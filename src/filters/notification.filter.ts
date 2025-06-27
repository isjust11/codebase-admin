import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Response } from 'express';
import { NotificationService } from '../services/notification.service';
import { NotificationType, NotificationPriority, NotificationStatus } from '../enums/notification.enum';
import { NOTIFICATION_EVENTS, NOTIFICATION_ROOMS } from 'src/constants/notification.constants';

@Catch(HttpException)
export class NotificationFilter implements ExceptionFilter {
  constructor(private readonly notificationService: NotificationService) {}

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();
    const status = exception.getStatus();

    // Gửi thông báo lỗi
    this.notificationService.notifySystemError({
      orderId: request.body?.orderId || 'unknown',
      userId: request.user?.id || 'unknown',
      userName: request.user?.name || 'unknown',
      error: exception.message,
      event: NOTIFICATION_EVENTS.SYSTEM_ERROR,
      room: NOTIFICATION_ROOMS.MANAGER_ROOM,
      message: 'Có lỗi hệ thống xảy ra',
      timestamp: new Date(),
      status: NotificationStatus.FAILED,
      type: NotificationType.SYSTEM,
      priority: NotificationPriority.LOW,
      tableStatus:''
    });

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: exception.message,
    });
  }
} 