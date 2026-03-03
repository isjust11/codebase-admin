import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserInteractionController } from '../controllers/user-interaction/user-interaction.controller';
import { UserInteractionService } from '../services/user-interaction.service';
import { UserInteraction } from '../entities/user-interaction.entity';
import { InteractionStats } from '../entities/interaction-stats.entity';
import { Article } from '../entities/article.entity';
import { Category } from '../entities/category.entity';
import { AuthModule } from './auth.module';
import { Book } from 'src/entities/book.entity';
import { User } from 'src/entities/user.entity';
import { NotificationModule } from './notification.module';

@Module({
  imports: [
    AuthModule,
    NotificationModule,
    TypeOrmModule.forFeature([
      UserInteraction,
      InteractionStats,
      Article,
      Category,
      Book,
      User,
    ]),
  ],
  controllers: [UserInteractionController],
  providers: [UserInteractionService],
  exports: [UserInteractionService],
})
export class UserInteractionModule {}
