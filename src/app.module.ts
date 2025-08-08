import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Table } from './entities/table.entity';
import { Feature } from './entities/feature.entity';
import { join } from 'path';
import { User } from './entities/user.entity';
import { FoodItem } from './entities/food-item.entity';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Guest } from './entities/guest.entity';
import { Media } from './entities/media.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { NotificationModule } from './modules/notification.module';
import { Category } from './entities/category.entity';
import { CategoryType } from './entities/category-type.entity';
import { Reservation } from './entities/reservation.entity';
import { History } from './entities/history.entity';
import { FeatureModule } from './modules/feature.module';
import { ExamModule } from './modules/exam.module';
import { Article } from './entities/article.entity';  
import { Exam } from './entities/exam.entity';
import { ExamQuestion } from './entities/exam-question.entity';
import { Question } from './entities/question.entity';
import { UserAnswer } from './entities/user-answer.entity';
import { UserExam } from './entities/user-exam.entity';
import { ArticleModule } from './modules/article.module';
import { Payment } from './entities/payment.entity';
import { FolkMedicine } from './entities/folk-medicine.entity';
import { Herbal } from './entities/herbal.entity';
import { HerbalImage } from './entities/herbal-image.entity';
import { Author } from './entities/author.entity';
import { Product } from './entities/product.entity';
import { ProductReview } from './entities/product-review.entity';
import { ProductComplaint } from './entities/product-complaint.entity';
import { AdvertisingSlider } from './entities/advertising-slider.entity';
import { CategoryModule } from './modules/category.module';
import { AuthModule } from './modules/auth.module';
import { MedicineModule } from './modules/medicine.module';
import { ECommerceModule } from './modules/e-commerce.module';
import { MediaModule } from './modules/media.module';
import { ConfigModule } from '@nestjs/config';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '3306'),
      username: process.env.DB_USERNAME ?? '',
      password: process.env.DB_PASSWORD ?? '',
      database: process.env.DB_DATABASE ?? '',
      entities: [
        Table,
        Feature,
        User,
        FoodItem,
        Order,
        OrderItem,
        Guest,
        Media,
        Permission,
        Role,
        RefreshToken,
        Category,
        CategoryType,
        Reservation,
        History,
        Article,
        Exam,
        ExamQuestion,
        Question,
        UserAnswer,
        UserExam,
        Payment,
        FolkMedicine,
        Herbal,
        HerbalImage,
        Author,
        Product,
        ProductReview,
        ProductComplaint,
        AdvertisingSlider,
      ],
      synchronize: true,
      migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
      migrationsRun: true,
    }),
    NotificationModule,
    CategoryModule,
    FeatureModule,
    ExamModule,
    ArticleModule,
    MedicineModule,
    ECommerceModule,
    MediaModule,
    AuthModule,
  ],
})
export class AppModule { }
