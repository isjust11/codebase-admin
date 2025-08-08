import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdvertisingSlider } from '../entities/advertising-slider.entity';
import { AdvertisingSliderService } from '../services/advertising-slider.service';
import { AdvertisingSliderController } from '../controllers/media/advertising-slider.controller';
import { Media } from 'src/entities/media.entity';
import { MediaService } from 'src/services/media.service';
import { MediaController } from 'src/controllers/medicine/media.controller';
import { AuthModule } from './auth.module';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([AdvertisingSlider, Media])
  ],
  controllers: [AdvertisingSliderController, MediaController],
  providers: [AdvertisingSliderService, MediaService],
  exports: [AdvertisingSliderService, MediaService],
})
export class MediaModule {} 