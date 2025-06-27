import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeatureContent } from '../entities/feature-content.entity';
import { FeatureContentService } from '../services/feature-content.service';
import { FeatureContentController } from '../controllers/feature-content.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FeatureContent])],
  providers: [FeatureContentService],
  controllers: [FeatureContentController],
  exports: [FeatureContentService],
})
export class FeatureContentModule {} 