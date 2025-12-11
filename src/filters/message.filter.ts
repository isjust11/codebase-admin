import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Response } from 'express';
import { NotificationService } from '../services/notification.service';
import { NOTIFICATION_EVENTS, NOTIFICATION_MESSAGES, NOTIFICATION_ROOMS } from '../constants/notification.constants';
import { NotificationPriority } from 'src/enums/notification.enum';
import { NotificationType } from 'src/enums/notification.enum';
import { NotificationStatus } from 'src/enums/notification.enum';

@Catch(HttpException)
export class MessageFilter implements ExceptionFilter {
  constructor(private readonly notificationService: NotificationService) {}

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();
    const status = exception.getStatus();
    

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: exception.message,
    });
  }
} 