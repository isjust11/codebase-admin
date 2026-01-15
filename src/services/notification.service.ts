import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from 'src/entities/notification.entity';
import { NotificationPriority, NotificationStatus, NotificationType } from 'src/enums/notification.enum';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  // find all notifications
  findAll() {
    return this.notificationRepository.find();
  }

  // find one notification
  findOne(id: number) {
    return this.notificationRepository.findOne({ where: { id } });
  }

  // find notifications by user id
  findByUserId(userId: number) {
    return this.notificationRepository.find({ where: { userId } });
  }

  // find notifications by type
  findByType(type: NotificationType) {
    return this.notificationRepository.find({ where: { type } });
  }

  // find notifications by status
  findByStatus(status: NotificationStatus) {
    return this.notificationRepository.find({ where: { status } });
  }

  // find notifications by priority
  findByPriority(priority: NotificationPriority) {
    return this.notificationRepository.find({ where: { priority } });
  }

  // find notifications by created at
  findByCreatedAt(createdAt: Date) {
    return this.notificationRepository.find({ where: { createdAt } });
  }

  // find notifications by updated at
  findByUpdatedAt(updatedAt: Date) {
    return this.notificationRepository.find({ where: { updatedAt } });
  }
  
  newNotification(type: NotificationType, data: any, title?: string, content?: string, userId?: number){
      var notification = this.notificationRepository.create({
        title: title,
        content: content,
        type: type,
        status: NotificationStatus.UNREAD,
        priority: NotificationPriority.MEDIUM,
        metadata: data,
        userId: userId, // Add userId to track which user this notification is for
      });
      return this.notificationRepository.save(notification);
  }

  /**
   * Create notifications for multiple users (used for topic notifications)
   * @param userIds Array of user IDs to create notifications for
   * @param type Notification type
   * @param data Notification metadata
   * @param title Notification title
   * @param content Notification content
   */
  async createNotificationsForUsers(
    userIds: number[],
    type: NotificationType,
    data: any,
    title?: string,
    content?: string,
  ) {
    if (userIds.length === 0) {
      return [];
    }

    const notifications = userIds.map(userId => 
      this.notificationRepository.create({
        title: title,
        content: content,
        type: type,
        status: NotificationStatus.UNREAD,
        priority: NotificationPriority.MEDIUM,
        metadata: data,
        userId: userId,
      })
    );

    return this.notificationRepository.save(notifications);
  }
}