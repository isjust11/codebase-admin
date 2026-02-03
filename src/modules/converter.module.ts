import { Module } from '@nestjs/common';
import { ConverterController } from '../controllers/converter/converter.controller';
import { ConverterService } from '../services/converter.service';
import { AuthModule } from './auth.module';

@Module({
  imports: [AuthModule
  ],
  controllers: [ConverterController],
  providers: [ConverterService],
  exports: [ConverterService],
})
export class ConverterModule {}
