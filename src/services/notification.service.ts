import { Injectable } from '@nestjs/common';
import { NotificationsGateway } from '../gateways/notifications.gateway';
import {
  NOTIFICATION_EVENTS,
  NOTIFICATION_ROOMS,
  NOTIFICATION_MESSAGES,
} from '../constants/notification.constants';
import { NotificationData } from '../interfaces/notification.interface';
import { NotificationStatus, NotificationType, NotificationPriority } from '../enums/notification.enum';

@Injectable()
export class NotificationService {
  constructor(private readonly notificationsGateway: NotificationsGateway) {}

  // Gửi thông báo khi có order mới
  async notifyNewOrder(data: Omit<NotificationData, 'event' | 'room' | 'message' | 'status' | 'type' | 'priority'>) {
    const notificationData: NotificationData = {
      ...data,
      event: NOTIFICATION_EVENTS.NEW_ORDER,
      room: NOTIFICATION_ROOMS.CHEF_ROOM,
      message: NOTIFICATION_MESSAGES.NEW_ORDER,
      timestamp: new Date(),
      status: NotificationStatus.PENDING,
      type: NotificationType.ORDER,
      priority: NotificationPriority.HIGH,
    };
    this.notificationsGateway.notifyNewOrder(notificationData);
  }

  // Gửi thông báo khi món ăn đã sẵn sàng
  async notifyFoodReady(data: Omit<NotificationData, 'event' | 'room' | 'message' | 'status' | 'type' | 'priority'>) {
    const notificationData: NotificationData = {
      ...data,
      event: NOTIFICATION_EVENTS.FOOD_READY,
      room: NOTIFICATION_ROOMS.WAITER_ROOM,
      message: NOTIFICATION_MESSAGES.FOOD_READY,
      timestamp: new Date(),
      status: NotificationStatus.PROCESSING,
      type: NotificationType.ORDER,
      priority: NotificationPriority.MEDIUM,
    };
    this.notificationsGateway.notifyFoodReady(notificationData);
  }

  // Gửi thông báo khi có thanh toán
  async notifyPayment(data: Omit<NotificationData, 'event' | 'room' | 'message' | 'status' | 'type' | 'priority'>) {
    const notificationData: NotificationData = {
      ...data,
      event: NOTIFICATION_EVENTS.PAYMENT_RECEIVED,
      room: NOTIFICATION_ROOMS.MANAGER_ROOM,
      message: NOTIFICATION_MESSAGES.PAYMENT_RECEIVED,
      timestamp: new Date(),
      status: NotificationStatus.COMPLETED,
      type: NotificationType.PAYMENT,
      priority: NotificationPriority.LOW,
    };
    this.notificationsGateway.notifyPayment(notificationData);
  }

  // Gửi thông báo lỗi hệ thống
  async notifySystemError(data: NotificationData) {
    const notificationData: NotificationData = {
      ...data,
      event: NOTIFICATION_EVENTS.SYSTEM_ERROR,
      room: NOTIFICATION_ROOMS.MANAGER_ROOM,
      message: 'Có lỗi hệ thống xảy ra',
      timestamp: new Date(),
      status: NotificationStatus.FAILED,
      type: NotificationType.SYSTEM,
      priority: NotificationPriority.URGENT,
    };
    this.notificationsGateway.notifyRoom(NOTIFICATION_ROOMS.MANAGER_ROOM, NOTIFICATION_EVENTS.SYSTEM_ERROR, notificationData);
  }
} 