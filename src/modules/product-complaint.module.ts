import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductComplaint } from '../entities/product-complaint.entity';
import { Product } from '../entities/product.entity';
import { ProductComplaintService } from '../services/product-complaint.service';
import { ProductComplaintController } from '../controllers/product-complaint.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProductComplaint, Product])],
  controllers: [ProductComplaintController],
  providers: [ProductComplaintService],
  exports: [ProductComplaintService],
})
export class ProductComplaintModule {} 