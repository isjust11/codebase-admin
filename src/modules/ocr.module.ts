import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth.module';
import { MediaModule } from './media.module';
import { OcrJob } from '../entities/ocr-job.entity';
import { OcrResult } from '../entities/ocr-result.entity';
import { OcrAsset } from '../entities/ocr-asset.entity';
import { OcrController } from '../controllers/ocr/ocr.controller';
import { OcrService } from '../services/ocr/ocr.service';
import { OcrResultConsumer } from '../services/ocr/ocr-result.consumer';
import { OcrMaintenanceService } from '../services/ocr/ocr-maintenance.service';
import { OcrGateway } from '../gateways/ocr.gateway';
import { RabbitmqOcrQueue } from '../queues/rabbitmq-ocr.queue';
import { OCR_QUEUE } from '../queues/ocr-queue.interface';

@Module({
  imports: [
    AuthModule,
    MediaModule,
    TypeOrmModule.forFeature([OcrJob, OcrResult, OcrAsset]),
  ],
  controllers: [OcrController],
  providers: [
    OcrService,
    OcrGateway,
    OcrResultConsumer,
    OcrMaintenanceService,
    { provide: OCR_QUEUE, useClass: RabbitmqOcrQueue },
  ],
  exports: [OcrService],
})
export class OcrModule {}
