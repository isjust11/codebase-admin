import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdvertisingSlider } from '../entities/advertising-slider.entity';
import { AdvertisingSliderService } from '../services/advertising-slider.service';
import { AdvertisingSliderController } from '../controllers/advertising-slider.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AdvertisingSlider])],
  controllers: [AdvertisingSliderController],
  providers: [AdvertisingSliderService],
  exports: [AdvertisingSliderService],
})
export class AdvertisingSliderModule {} 