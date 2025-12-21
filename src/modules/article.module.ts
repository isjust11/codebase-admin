import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from 'src/entities/article.entity';
import { ArticleController } from 'src/controllers/article/article.controller';
import { ArticleService } from 'src/services/article.service';
import { AuthModule } from './auth.module';
import { CategoryModule } from './category.module';
import { UserInteractionModule } from './user-interaction.module';
import { NotificationModule } from './notification.module';

@Module({
  imports: [AuthModule,
    NotificationModule,
            TypeOrmModule.forFeature([Article]), 
            CategoryModule, 
            UserInteractionModule,
          ],
  providers: [ArticleService],
  controllers: [ArticleController],
  exports: [ArticleService],
})
export class ArticleModule { } 