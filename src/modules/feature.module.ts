import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeatureContent } from '../entities/feature-content.entity';
import { FeatureContentService } from '../services/feature-content.service';
import { FeatureContentController } from '../controllers/auth/feature-content.controller';
import { Feature } from '../entities/feature.entity';
import { AuthModule } from './auth.module';
import { FeatureService } from 'src/services/feature.service';
import { FeatureController } from 'src/controllers/auth/feature.controller';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([FeatureContent,Feature])],
  providers: [FeatureContentService,FeatureService],
  controllers: [FeatureContentController,FeatureController],
  exports: [FeatureContentService,FeatureService],
})
export class FeatureModule {} 