import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookService } from 'src/services/book.service';
import { ReadingProgressService } from 'src/services/reading-progress.service';
import { AuthModule } from './auth.module';
import { Book } from 'src/entities/book.entity';
import { ReadingProgress } from 'src/entities/reading-progress.entity';
import { BookController } from 'src/controllers/ebooks/book.controller';
import { ReadingProgressController } from 'src/controllers/ebooks/reading-progress.controller';
import { CategoryModule } from './category.module';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Book, ReadingProgress]), CategoryModule ],
  controllers: [BookController, ReadingProgressController],
  providers: [BookService, ReadingProgressService,],
  exports: [BookService, ReadingProgressService,],
})
export class EbookModule { }
