import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookService } from 'src/services/book.service';
import { AuthModule } from './auth.module';
import { Book } from 'src/entities/book.entity';
import { UserInteraction } from 'src/entities/user-interaction.entity';
import { InteractionStats } from 'src/entities/interaction-stats.entity';
import { BookController } from 'src/controllers/ebooks/book.controller';
import { CategoryModule } from './category.module';
import { NotificationModule } from './notification.module';
import { Category } from 'src/entities/category.entity';

@Module({
  imports: [
    AuthModule,
    NotificationModule,
    TypeOrmModule.forFeature([Book, UserInteraction, InteractionStats, Category]),
  ],
  controllers: [BookController],
  providers: [BookService],
  exports: [BookService],
})
export class EbookModule { }
