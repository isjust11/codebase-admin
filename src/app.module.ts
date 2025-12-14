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
import { Notification } from './entities/notification.entity';
import { NotificationConfig } from './entities/notification-config.entity';
import { FcmToken } from './entities/fcm-token.entity';
import { UserInteraction } from './entities/user-interaction.entity';
import { InteractionStats } from './entities/interaction-stats.entity';
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
import { FolkMedicineIngredient } from './entities/folk-medicine-ingredient.entity';
import { Herbal } from './entities/herbal.entity';
import { MultiImage } from './entities/multi-image.entity';
import { Author } from './entities/author.entity';
import { Product } from './entities/product.entity';
import { ProductReview } from './entities/product-review.entity';
import { ProductComplaint } from './entities/product-complaint.entity';
import { AdvertisingSlider } from './entities/advertising-slider.entity';
import { DataSource } from './entities/data-source.entity';
import { Page } from './entities/page.entity';
import { CategoryModule } from './modules/category.module';
import { AuthModule } from './modules/auth.module';
import { MedicineModule } from './modules/medicine.module';
import { ECommerceModule } from './modules/e-commerce.module';
import { MediaModule } from './modules/media.module';
import { DashboardModule } from './modules/dashboard.module';
import { UserInteractionModule } from './modules/user-interaction.module';
import { PageModule } from './modules/page.module';
import { FeedbackModule } from './modules/feedback.module';
import { Feedback } from './entities/feedback.entity';
import { ConfigModule } from '@nestjs/config';
import { FcmController } from './controllers/fcm/fcm.controller';
import { Disease } from './entities/disease.entity';
import { TopicSubscription } from './entities/topic-subscription.entity';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      driver: require('mysql2'),
      host: process.env.DB_HOST ?? '',
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
        FolkMedicineIngredient,
        Herbal,
        MultiImage,
        Author,
        Product,
        ProductReview,
        ProductComplaint,
        AdvertisingSlider,
        DataSource,
        Notification,
        NotificationConfig,
        FcmToken,
        UserInteraction,
        InteractionStats,
        Page,
        Feedback,
        Disease,
        TopicSubscription,
      ],
      synchronize: true,
      migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
      migrationsRun: true,
      // Cấu hình để hỗ trợ MySQL 8.0+ với caching_sha2_password
      extra: {
        charset: 'utf8mb4',
        supportBigNumbers: true,
        bigNumberStrings: true,
        dateStrings: true,
        debug: false,
        trace: false,
        multipleStatements: true,
        // Hỗ trợ authentication plugin mới
        authPlugins: {
          mysql_clear_password: () => () => Buffer.from([0x00]),
        },
      },
      // Cấu hình SSL
      ssl: false,
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
    DashboardModule,
    UserInteractionModule,
    PageModule,
    FeedbackModule
  ],
  controllers: [FcmController],
})
export class AppModule { }
