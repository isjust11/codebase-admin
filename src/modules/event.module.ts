import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from '../entities/event.entity';
import { Guest } from '../entities/guest.entity';
import { Template } from '../entities/template.entity';
import { Wish } from '../entities/wish.entity';
import { EventService } from '../services/event.service';
import { GuestService } from '../services/guest.service';
import { InvitationRenderService } from '../services/invitation-render.service';
import { WishService } from '../services/wish.service';
import { EventController } from '../controllers/event/event.controller';
import { PublicInviteController } from '../controllers/event/public-invite.controller';
import { PublicEventsController } from '../controllers/event/public-events.controller';
import { AuthModule } from './auth.module';
import { TemplateModule } from './template.module';
import { MediaModule } from './media.module';

@Module({
  imports: [
    AuthModule,
    TemplateModule,
    MediaModule,
    TypeOrmModule.forFeature([Event, Guest, Template, Wish]),
  ],
  providers: [EventService, GuestService, InvitationRenderService, WishService],
  controllers: [EventController, PublicInviteController, PublicEventsController],
  exports: [EventService, GuestService, WishService],
})
export class EventModule {}
