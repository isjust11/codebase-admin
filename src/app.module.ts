import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { TableController } from './controllers/table.controller';
import { AppService } from './app.service';
import { Table } from './entities/table.entity';
import { TableService } from './services/table.service';
import { FeatureController } from './controllers/feature.controller';
import { Feature } from './entities/feature.entity';
import { FeatureService } from './services/feature.service';
import { join } from 'path';
import { NotificationsGateway } from './gateways/notifications.gateway';
import { User } from './entities/user.entity';
import { FoodItemController } from './controllers/food-item.controller';
import { OrderController } from './controllers/order.controller';
import { FoodItemService } from './services/food-item.service';
import { OrderService } from './services/order.service';
import { FoodItem } from './entities/food-item.entity';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { AuthController } from './controllers/auth.controller';
import { Guest } from './entities/guest.entity';
import { UserController } from './controllers/user.controller';
import { UserService } from './services/user.service';
import { MediaController } from './controllers/media.controller';
import { MediaService } from './services/media.service';
import { Media } from './entities/media.entity';
import { ConfigModule } from '@nestjs/config';
import { PermissionController } from './controllers/permission.controller';
import { RoleController } from './controllers/role.controller';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { RoleService } from './services/role.service';
import { PermissionService } from './services/permission.service';
import { RefreshToken } from './entities/refresh-token.entity';
import { AuthService } from './services/auth.service';
import { EmailService } from './services/email.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './guards/jwt.strategy';
import { GoogleStrategy } from './guards/strategies/google.strategy';
import { FacebookStrategy } from './guards/strategies/facebook.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { NotificationModule } from './modules/notification.module';
import { Category } from './entities/category.entity';
import { CategoryController } from './controllers/category.controller';
import { CategoryService } from './services/category.service';
import { CategoryType } from './entities/category-type.entity';
import { CategoryTypeController } from './controllers/category-type.controller';
import { CategoryTypeService } from './services/category-type.service';
import { Reservation } from './entities/reservation.entity';
import { History } from './entities/history.entity';
import { FeatureContentModule } from './modules/feature-content.module';
import { ExamModule } from './modules/exam.module';
import { QuestionModule } from './modules/question.module';
import { ExamQuestionModule } from './modules/exam-question.module';
import { UserExamModule } from './modules/user-exam.module';
import { UserAnswerModule } from './modules/user-answer.module';
import { Article } from './entities/article.entity';
import { ArticleController } from './controllers/article.controller';
import { Exam } from './entities/exam.entity';
import { ExamQuestion } from './entities/exam-question.entity';
import { Question } from './entities/question.entity';
import { UserAnswer } from './entities/user-answer.entity';
import { UserExam } from './entities/user-exam.entity';
import { ArticleModule } from './modules/article.module';
import { Payment } from './entities/payment.entity';
import { PaymentModule } from './modules/payment.module';
import { FolkMedicine } from './entities/folk-medicine.entity';
import { FolkMedicineModule } from './modules/folk-medicine.module';
import { Herbal } from './entities/herbal.entity';
import { HerbalImage } from './entities/herbal-image.entity';
import { Author } from './entities/author.entity';
import { HerbalModule } from './modules/herbal.module';
import { AuthorModule } from './modules/author.module';
import { CategoryTypeSyncController } from './controllers/category-type-sync.controller';
import { CategoryTypeSyncService } from './services/category-type-sync.service';
import { Product } from './entities/product.entity';
import { ProductReview } from './entities/product-review.entity';
import { ProductComplaint } from './entities/product-complaint.entity';
import { ProductModule } from './modules/product.module';
import { ProductReviewModule } from './modules/product-review.module';
import { ProductComplaintModule } from './modules/product-complaint.module';
import { AdvertisingSlider } from './entities/advertising-slider.entity';
import { AdvertisingSliderModule } from './modules/advertising-slider.module';
@Module({
  imports: [
    ConfigModule,
    ConfigModule.forRoot({
      envFilePath: '.env', // Đường dẫn đến tệp .env
      isGlobal: true, // Biến môi trường sẽ khả dụng toàn cục
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'AyTUug0rjLJrLF5FJOdyaVdNkaZgugvp',
      signOptions: { expiresIn: '24h' },
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '3306'),
      username: process.env.DB_USERNAME ?? 'root',
      password: process.env.DB_PASSWORD ?? 'Hg!@1997',
      database: process.env.DB_DATABASE ?? 'aptis_el',
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
    TypeOrmModule.forFeature([
      Table,
      Feature,
      FoodItem,
      Order,
      OrderItem,
      User,
      Guest,
      Media,
      Permission,
      Role,
      RefreshToken,
      Category,
      CategoryType,
      Reservation,
      History,
      Product,
      ProductReview,
      ProductComplaint,
      AdvertisingSlider,
    ]),
    NotificationModule,
    FeatureContentModule,
    ExamModule,
    QuestionModule,
    ExamQuestionModule,
    UserExamModule,
    UserAnswerModule,
    ArticleModule,
    PaymentModule,
    FolkMedicineModule,
    HerbalModule,
    AuthorModule,
    ProductModule,
    ProductReviewModule,
    ProductComplaintModule,
    AdvertisingSliderModule,
    // AuthModule,
  ],
  controllers: [
    TableController,
    FeatureController,
    FoodItemController,
    OrderController,
    AuthController,
    UserController,
    MediaController,
    PermissionController,
    RoleController,
    CategoryController,
    CategoryTypeController,
    CategoryTypeSyncController,
  ],
  providers: [
    AppService,
    TableService,
    FeatureService,
    NotificationsGateway,
    FoodItemService,
    OrderService,
    UserService,
    MediaService,
    PermissionService,
    RoleService,
    AuthService,
    EmailService,
    JwtStrategy,
    GoogleStrategy,
    FacebookStrategy,
    CategoryService,
    CategoryTypeService,
    CategoryTypeSyncService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  exports: [UserService],
})
export class AppModule { }
