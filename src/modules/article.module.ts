import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from 'src/entities/article.entity';
import { ArticleController } from 'src/controllers/article.controller';
import { ArticleService } from 'src/services/article.service';
import { User } from 'src/entities/user.entity';
import { RoleService } from '../services/role.service';
import { Role } from '../entities/role.entity';
import { Feature } from '../entities/feature.entity';
import { Permission } from '../entities/permission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Article, User, Role, Feature, Permission])],
  providers: [ArticleService, RoleService],
  controllers: [ArticleController],
  exports: [ArticleService],
})
export class ArticleModule {} 