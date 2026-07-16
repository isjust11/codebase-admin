import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from './auth.module';
import { MediaModule } from './media.module';
import { NotificationModule } from './notification.module';
import { ChatConversation } from '../entities/chat-conversation.entity';
import { ChatConversationMember } from '../entities/chat-conversation-member.entity';
import { ChatMessage } from '../entities/chat-message.entity';
import { ChatMessageReceipt } from '../entities/chat-message-receipt.entity';
import { User } from '../entities/user.entity';
import { ChatService } from '../services/chat/chat.service';
import { ChatRedisService } from '../services/chat/chat-redis.service';
import { ChatGateway } from '../gateways/chat.gateway';
import { ChatController } from '../controllers/chat/chat.controller';

@Module({
  imports: [
    AuthModule,
    MediaModule,
    forwardRef(() => NotificationModule),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'AyTUug0rjLJrLF5FJOdyaVdNkaZgugvp',
      signOptions: { expiresIn: '24h' },
    }),
    TypeOrmModule.forFeature([
      ChatConversation,
      ChatConversationMember,
      ChatMessage,
      ChatMessageReceipt,
      User,
    ]),
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatRedisService, ChatGateway],
  exports: [ChatService, ChatRedisService, ChatGateway],
})
export class ChatModule {}
