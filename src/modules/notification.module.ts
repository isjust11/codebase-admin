import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsGateway } from '../gateways/notifications.gateway';
import { NotificationService } from '../services/notification.service';
import { NotificationGuard } from '../guards/notification.guard';
import { EventGuard } from '../guards/event.guard';
import { RoomGuard } from '../guards/room.guard';
import { MessageGuard } from '../guards/message.guard';
import { NotificationPipe } from '../pipes/notification.pipe';
import { EventPipe } from '../pipes/event.pipe';
import { RoomPipe } from '../pipes/room.pipe';
import { MessagePipe } from '../pipes/message.pipe';
import { NotificationFilter } from '../filters/notification.filter';
import { EventFilter } from '../filters/event.filter';
import { RoomFilter } from '../filters/room.filter';
import { MessageFilter } from '../filters/message.filter';
import { CategoryModule } from './category.module';
import { AuthModule } from './auth.module';
import { Notification } from '../entities/notification.entity';
import { NotificationConfig } from '../entities/notification-config.entity';
import { FcmToken } from '../entities/fcm-token.entity';
import { TopicSubscription } from '../entities/topic-subscription.entity';
import { NotificationRecordService } from '../services/notification-record.service';
import { NotificationConfigService } from '../services/notification-config.service';
import { FcmTokenService } from '../services/fcm-token.service';
import { FirebaseService } from '../services/firebase.service';
import { FcmService } from '../services/fcm.service';
import { TopicSubscriptionService } from '../services/topic-subscription.service';
import { NotificationConfigController } from '../controllers/notification/notification-config.controller';
import { FcmTokenController } from '../controllers/notification/fcm-token.controller';
import { NotificationController } from '../controllers/notification/notification.controller';

@Module({
  imports:[
    AuthModule,
    CategoryModule,
    TypeOrmModule.forFeature([Notification, NotificationConfig, FcmToken, TopicSubscription])
  ],
  providers: [
    NotificationsGateway,
    NotificationService,
    NotificationRecordService,
    NotificationConfigService,
    FcmTokenService,
    TopicSubscriptionService,
    FirebaseService,
    FcmService,
    NotificationGuard,
    EventGuard,
    RoomGuard,
    MessageGuard,
    NotificationPipe,
    EventPipe,
    RoomPipe,
    MessagePipe,
    NotificationFilter,
    EventFilter,
    RoomFilter,
    MessageFilter,
  ],
  controllers: [
    NotificationConfigController,
    FcmTokenController,
    NotificationController,
  ],
  exports: [NotificationService, FcmService, FcmTokenService, TopicSubscriptionService],
})
export class NotificationModule {} 