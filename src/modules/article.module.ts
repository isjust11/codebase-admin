import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from 'src/entities/article.entity';
import { ArticleController } from 'src/controllers/article/article.controller';
import { ArticleService } from 'src/services/article.service';
import { AuthModule } from './auth.module';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Article])],
  providers: [ArticleService],
  controllers: [ArticleController],
  exports: [ArticleService],
})
export class ArticleModule {} 