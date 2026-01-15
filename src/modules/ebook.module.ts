import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookService } from 'src/services/book.service';
import { ReadingProgressService } from 'src/services/reading-progress.service';
import { AuthModule } from './auth.module';
import { Book } from 'src/entities/book.entity';
import { ReadingProgress } from 'src/entities/reading-progress.entity';
import { UserInteraction } from 'src/entities/user-interaction.entity';
import { InteractionStats } from 'src/entities/interaction-stats.entity';
import { BookController } from 'src/controllers/ebooks/book.controller';
import { ReadingProgressController } from 'src/controllers/ebooks/reading-progress.controller';
import { CategoryModule } from './category.module';
import { NotificationModule } from './notification.module';

@Module({
  imports: [
    AuthModule,
    NotificationModule,
    TypeOrmModule.forFeature([Book, ReadingProgress, UserInteraction, InteractionStats]),
    CategoryModule,
  ],
  controllers: [BookController, ReadingProgressController],
  providers: [BookService, ReadingProgressService],
  exports: [BookService, ReadingProgressService],
})
export class EbookModule { }
