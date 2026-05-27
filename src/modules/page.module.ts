import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Page } from '../entities/page.entity';
import { PageService } from '../services/page.service';
import { PageController } from '../controllers/page/page.controller';
import { AppAdsController } from '../controllers/page/app-ads.controller';
import { AuthModule } from './auth.module';

@Module({
  imports: [AuthModule,TypeOrmModule.forFeature([Page])],
  controllers: [PageController, AppAdsController],
  providers: [PageService],
  exports: [PageService],
})
export class PageModule {}
