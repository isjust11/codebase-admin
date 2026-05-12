import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoogleDriveService } from 'src/services/google-drive.service';
import { GoogleDriveSyncService } from 'src/services/google-drive-sync.service';
import { GoogleDriveSyncController } from 'src/controllers/google-drive/google-drive-sync.controller';
import { Media } from 'src/entities/media.entity';
import { Book } from 'src/entities/book.entity';
import { Category } from 'src/entities/category.entity';
import { AuthModule } from './auth.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    AuthModule,
    TypeOrmModule.forFeature([Media, Book, Category]),
  ],
  controllers: [GoogleDriveSyncController],
  providers: [GoogleDriveService, GoogleDriveSyncService],
  exports: [GoogleDriveService, GoogleDriveSyncService],
})
export class GoogleDriveModule {}
