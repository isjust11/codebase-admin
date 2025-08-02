import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HerbalController } from '../controllers/herbal.controller';
import { HerbalService } from '../services/herbal.service';
import { HerbalImageController } from '../controllers/herbal-image.controller';
import { HerbalImageService } from '../services/herbal-image.service';
import { Herbal } from '../entities/herbal.entity';
import { HerbalImage } from '../entities/herbal-image.entity';
import { User } from '../entities/user.entity';
import { Category } from '../entities/category.entity';
import { RoleService } from 'src/services/role.service';
import { Role } from 'src/entities/role.entity';
import { Permission } from 'src/entities/permission.entity';
import { PermissionService } from 'src/services/permission.service';
import { Feature } from 'src/entities/feature.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Herbal, HerbalImage, User, Category, Role, Permission, Feature])],
  controllers: [HerbalController, HerbalImageController],
  providers: [HerbalService, HerbalImageService, RoleService, PermissionService],
  exports: [HerbalService, HerbalImageService],
})
export class HerbalModule {} 