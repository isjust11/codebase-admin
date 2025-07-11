import { Controller, Post, Body, UseGuards, UsePipes, UseFilters } from '@nestjs/common';
import { NotificationService } from '../services/notification.service';
import { NotificationGuard } from '../guards/notification.guard';
import { EventGuard } from '../guards/event.guard';
import { RoomGuard } from '../guards/room.guard';
import { NotificationPipe } from '../pipes/notification.pipe';
import { EventPipe } from '../pipes/event.pipe';
import { RoomPipe } from '../pipes/room.pipe';
import { NotificationFilter } from '../filters/notification.filter';
import { EventFilter } from '../filters/event.filter';
import { RoomFilter } from '../filters/room.filter';
import { Notification } from '../decorators/notification.decorator';
import { Event } from '../decorators/event.decorator';
import { Room } from '../decorators/room.decorator';
import { NotificationType, NotificationPriority } from '../enums/notification.enum';
import { CreateNotificationDto } from '../dtos/notification.dto';
import { NOTIFICATION_EVENTS, NOTIFICATION_ROOMS } from '../constants/notification.constants';
import { BaseController } from './base.controller';
import { RequirePermission } from 'src/decorators/require-permissions.decorator';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@UseFilters(NotificationFilter, EventFilter, RoomFilter)
export class NotificationController extends BaseController{
  constructor(private readonly notificationService: NotificationService) {
    super();
  }

  @Post('new-order')
  @RequirePermission('CREATE', 'notification')
  @UsePipes(NotificationPipe, EventPipe, RoomPipe)
  @Notification({ type: NotificationType.ORDER, priority: NotificationPriority.HIGH })
  @Event({ event: NOTIFICATION_EVENTS.NEW_ORDER, description: 'Thông báo đơn hàng mới' })
  @Room({ room: NOTIFICATION_ROOMS.CHEF_ROOM, description: 'Phòng đầu bếp' })
  async createNewOrder(@Body() data: CreateNotificationDto & { timestamp: Date }) {
    await this.notificationService.notifyNewOrder(data);
    return { success: true, message: 'Thông báo đơn hàng mới đã được gửi' };
  }

  @Post('food-ready')
  @RequirePermission('CREATE', 'notification')
  @UsePipes(NotificationPipe, EventPipe, RoomPipe)
  @Notification({ type: NotificationType.ORDER, priority: NotificationPriority.MEDIUM })
  @Event({ event: NOTIFICATION_EVENTS.FOOD_READY, description: 'Thông báo món ăn đã sẵn sàng' })
  @Room({ room: NOTIFICATION_ROOMS.WAITER_ROOM, description: 'Phòng nhân viên phục vụ' })
  async notifyFoodReady(@Body() data: CreateNotificationDto & { timestamp: Date }) {
    await this.notificationService.notifyFoodReady(data);
    return { success: true, message: 'Thông báo món ăn đã sẵn sàng đã được gửi' };
  }

  @Post('payment')
  @RequirePermission('CREATE', 'notification')
  @UsePipes(NotificationPipe, EventPipe, RoomPipe)
  @Notification({ type: NotificationType.PAYMENT, priority: NotificationPriority.LOW })
  @Event({ event: NOTIFICATION_EVENTS.PAYMENT_RECEIVED, description: 'Thông báo thanh toán' })
  @Room({ room: NOTIFICATION_ROOMS.MANAGER_ROOM, description: 'Phòng quản lý' })
  async notifyPayment(@Body() data: CreateNotificationDto & { timestamp: Date }) {
    await this.notificationService.notifyPayment(data);
    return { success: true, message: 'Thông báo thanh toán đã được gửi' };
  }
} 