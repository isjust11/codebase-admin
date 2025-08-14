import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TableController } from '../controllers/ecommerce/table.controller';
import { TableService } from '../services/table.service';
import { Table } from '../entities/table.entity';
import { Order } from 'src/entities/order.entity';
import { Reservation } from 'src/entities/reservation.entity';
import { Payment } from 'src/entities/payment.entity';
import { Product } from 'src/entities/product.entity';
import { ProductReview } from 'src/entities/product-review.entity';
import { ProductComplaint } from 'src/entities/product-complaint.entity';
import { FoodItem } from 'src/entities/food-item.entity';
import { OrderItem } from 'src/entities/order-item.entity';
import { OrderController } from 'src/controllers/ecommerce/order.controller';
import { ReservationController } from 'src/controllers/ecommerce/reservation.controller';
import { PaymentController } from 'src/controllers/ecommerce/payment.controller';
import { ProductReviewController } from 'src/controllers/ecommerce/product-review.controller';
import { ProductComplaintController } from 'src/controllers/ecommerce/product-complaint.controller';
import { FoodItemController } from 'src/controllers/ecommerce/food-item.controller';
import { OrderService } from 'src/services/order.service';
import { ReservationService } from 'src/services/reservation.service';
import { PaymentService } from 'src/services/payment.service';
import { ProductService } from 'src/services/product.service';
import { ProductReviewService } from 'src/services/product-review.service';
import { HistoryController } from 'src/controllers/ecommerce/history.controller';
import { HistoryService } from 'src/services/history.service';
import { FoodItemService } from 'src/services/food-item.service';
import { ProductComplaintService } from 'src/services/product-complaint.service';
import { AuthModule } from './auth.module';
import { CategoryModule } from './category.module';
import { History } from 'src/entities/history.entity';
import { NotificationsGateway } from 'src/gateways/notifications.gateway';
import { ConfigModule } from '@nestjs/config';
import { ProductController } from 'src/controllers/ecommerce/product.controller';

@Module({
  imports: [
    AuthModule,
    CategoryModule,
    ConfigModule,
    TypeOrmModule.forFeature([
    Table, 
    Order,
    Reservation, 
    History, 
    Payment, 
    Product, 
    ProductReview,
    ProductComplaint,
    FoodItem,
    OrderItem,
  ])],
  controllers: [
    TableController,
    OrderController,
    ReservationController,
    HistoryController,
    PaymentController,
    ProductReviewController,
    ProductComplaintController,
    FoodItemController,
    ProductController,
  ],
  providers: [
    TableService,
    OrderService,
    ReservationService,
    HistoryService,
    PaymentService,
    ProductService,
    ProductReviewService,
    ProductComplaintService,
    FoodItemService,
    NotificationsGateway
  ],
  exports: [
    TableService,
    OrderService,
    ReservationService,
    HistoryService,
    PaymentService,
    ProductReviewService,
    ProductComplaintService,
    FoodItemService,
    NotificationsGateway
  ],
  })
export class ECommerceModule {} 