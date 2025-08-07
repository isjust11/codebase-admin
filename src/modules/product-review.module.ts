import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductReview } from '../entities/product-review.entity';
import { Product } from '../entities/product.entity';
import { ProductReviewService } from '../services/product-review.service';
import { ProductReviewController } from '../controllers/product-review.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProductReview, Product])],
  controllers: [ProductReviewController],
  providers: [ProductReviewService],
  exports: [ProductReviewService],
})
export class ProductReviewModule {} 