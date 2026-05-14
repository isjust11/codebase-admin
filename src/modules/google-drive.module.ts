import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoogleDriveService } from 'src/services/google-drive.service';
import { GoogleDriveSyncService } from 'src/services/google-drive-sync.service';
import { GoogleDriveSyncController } from 'src/controllers/google-drive/google-drive-sync.controller';
import { Media } from 'src/entities/media.entity';
import { Book } from 'src/entities/book.entity';
import { Category } from 'src/entities/category.entity';
import { User } from 'src/entities/user.entity';
import { AuthModule } from './auth.module';
import { MediaService } from 'src/services/media.service';
import { CategoryType } from 'src/entities/category-type.entity';
import { GeminiService } from 'src/services/gemini.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    AuthModule,
    TypeOrmModule.forFeature([Media, Book, Category, User, CategoryType]),
  ],
  controllers: [GoogleDriveSyncController],
  providers: [GoogleDriveService, GoogleDriveSyncService, MediaService, GeminiService],
  exports: [GoogleDriveService, GoogleDriveSyncService],
})
export class GoogleDriveModule { }
