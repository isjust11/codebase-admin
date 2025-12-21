import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserInteractionController } from '../controllers/user-interaction/user-interaction.controller';
import { UserInteractionService } from '../services/user-interaction.service';
import { UserInteraction } from '../entities/user-interaction.entity';
import { InteractionStats } from '../entities/interaction-stats.entity';
import { Article } from '../entities/article.entity';
import { Category } from '../entities/category.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserInteraction,
      InteractionStats,
      Article,
      Category,
    ]),
  ],
  controllers: [UserInteractionController],
  providers: [UserInteractionService],
  exports: [UserInteractionService],
})
export class UserInteractionModule {}
