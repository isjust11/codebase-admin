import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsGateway } from '../gateways/notifications.gateway';
import { NotificationService } from '../services/notification.service';
import { NotificationController } from '../controllers/notification/notification.controller';
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
import { NotificationTemplate } from '../entities/notification-template.entity';
import { NotificationConfig } from '../entities/notification-config.entity';
import { FcmToken } from '../entities/fcm-token.entity';
import { NotificationRecordService } from '../services/notification-record.service';
import { NotificationTemplateService } from '../services/notification-template.service';
import { NotificationConfigService } from '../services/notification-config.service';
import { FcmTokenService } from '../services/fcm-token.service';
import { FirebaseService } from '../services/firebase.service';
import { FcmService } from '../services/fcm.service';
import { NotificationRecordController } from '../controllers/notification/notification-record.controller';
import { NotificationTemplateController } from '../controllers/notification/notification-template.controller';
import { NotificationConfigController } from '../controllers/notification/notification-config.controller';
import { FcmTokenController } from '../controllers/notification/fcm-token.controller';

@Module({
  imports:[
    AuthModule,
    CategoryModule,
    TypeOrmModule.forFeature([Notification, NotificationTemplate, NotificationConfig, FcmToken])
  ],
  providers: [
    NotificationsGateway,
    NotificationService,
    NotificationRecordService,
    NotificationTemplateService,
    NotificationConfigService,
    FcmTokenService,
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
    NotificationController,
    NotificationRecordController,
    NotificationTemplateController,
    NotificationConfigController,
    FcmTokenController,
  ],
  exports: [NotificationService, FcmService],
})
export class NotificationModule {} 