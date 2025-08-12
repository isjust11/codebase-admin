import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from '../controllers/dashboard/dashboard.controller';
import { DashboardService } from '../services/dashboard.service';
import { User } from '../entities/user.entity';
import { Order } from '../entities/order.entity';
import { Product } from '../entities/product.entity';
import { Article } from '../entities/article.entity';
import { Herbal } from '../entities/herbal.entity';
import { Author } from 'src/entities/author.entity';
import { AuthModule } from './auth.module';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      User,
      Order,
      Product,
      Article,
      Author,
      Herbal,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
