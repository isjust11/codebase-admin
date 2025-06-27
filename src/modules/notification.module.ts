import { Module } from '@nestjs/common';
import { NotificationsGateway } from '../gateways/notifications.gateway';
import { NotificationService } from '../services/notification.service';
import { NotificationController } from '../controllers/notification.controller';
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

@Module({
  providers: [
    NotificationsGateway,
    NotificationService,
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
  controllers: [NotificationController],
  exports: [NotificationService],
})
export class NotificationModule {} 