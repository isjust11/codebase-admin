import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeatureContent } from '../entities/feature-content.entity';
import { FeatureContentService } from '../services/feature-content.service';
import { FeatureContentController } from '../controllers/feature-content.controller';
import { RoleService } from '../services/role.service';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { Feature } from '../entities/feature.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FeatureContent, Role, Permission, Feature])],
  providers: [FeatureContentService, RoleService],
  controllers: [FeatureContentController],
  exports: [FeatureContentService],
})
export class FeatureContentModule {} 