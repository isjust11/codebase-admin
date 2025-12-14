import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NotificationStatus, NotificationType, NotificationPriority } from '../enums/notification.enum';
import { Article } from 'src/entities/article.entity';
import { DeepPartial, Repository } from 'typeorm';
import { Notification } from 'src/entities/notification.entity';
import { FolkMedicine } from 'src/entities/folk-medicine.entity';
import { Feedback } from 'src/entities/feedback.entity';

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
    const template = this.buildTemplateNotification(type);
    if (template) {
      var notification = this.notificationRepository.create({
        title: title ?? template.title,
        content: content ?? template.content,
        type: type,
        status: NotificationStatus.UNREAD,
        priority: NotificationPriority.MEDIUM,
        metadata: data,
        userId: userId, // Add userId to track which user this notification is for
      });
      return this.notificationRepository.save(notification);
    }
    return null;
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

    const template = this.buildTemplateNotification(type);
    if (!template) {
      return [];
    }

    const notifications = userIds.map(userId => 
      this.notificationRepository.create({
        title: title ?? template.title,
        content: content ?? template.content,
        type: type,
        status: NotificationStatus.UNREAD,
        priority: NotificationPriority.MEDIUM,
        metadata: data,
        userId: userId,
      })
    );

    return this.notificationRepository.save(notifications);
  }
  // build template notification by type
  buildTemplateNotification(type: NotificationType) {
    switch (type) {
      case NotificationType.NEW_ARTICLE:
        return {
          title: 'New article created',
          content: 'New article created'
        };
      case NotificationType.FOLK_MEDICINE:
        return {
          title: 'New folk medicine created',
          content: 'New folk medicine created'
        };
      case NotificationType.FEEDBACK:
        return {
          title: 'New feedback created',
          content: 'New feedback created'
        };
      case NotificationType.SYSTEM:
        return {
          title: 'System error',
          content: 'System error'
        };
    }
  }
}