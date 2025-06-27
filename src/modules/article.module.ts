import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from 'src/entities/article.entity';
import { ArticleController } from 'src/controllers/article.controller';
import { ArticleService } from 'src/services/article.service';
import { User } from 'src/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Article, User])],
  providers: [ArticleService],
  controllers: [ArticleController],
  exports: [ArticleService],
})
export class ArticleModule {} 