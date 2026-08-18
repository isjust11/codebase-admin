import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Feature } from './entities/feature.entity';
import { join } from 'path';
import { User } from './entities/user.entity';
import { Media } from './entities/media.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { NotificationModule } from './modules/notification.module';
import { Notification } from './entities/notification.entity';
import { NotificationConfig } from './entities/notification-config.entity';
import { FcmToken } from './entities/fcm-token.entity';
import { InteractionStats } from './entities/interaction-stats.entity';
import { Category } from './entities/category.entity';
import { CategoryType } from './entities/category-type.entity';
import { FeatureModule } from './modules/feature.module';
import { Article } from './entities/article.entity';
import { ArticleModule } from './modules/article.module';
import { Payment } from './entities/payment.entity';
import { MultiImage } from './entities/multi-image.entity';
import { AdvertisingSlider } from './entities/advertising-slider.entity';
import { Page } from './entities/page.entity';
import { CategoryModule } from './modules/category.module';
import { AuthModule } from './modules/auth.module';
import { MediaModule } from './modules/media.module';
import { DashboardModule } from './modules/dashboard.module';
import { UserInteractionModule } from './modules/user-interaction.module';
import { PageModule } from './modules/page.module';
import { FeedbackModule } from './modules/feedback.module';
import { Feedback } from './entities/feedback.entity';
import { ConfigModule } from '@nestjs/config';
import { FcmController } from './controllers/fcm/fcm.controller';
import { DeepLinkController } from './controllers/deep-link/deep-link.controller';
import { TopicSubscription } from './entities/topic-subscription.entity';
import { UserInteraction } from './entities/user-interaction.entity';
import { ConverterModule } from './modules/converter.module';
import { SubscriptionModule } from './modules/subscription.module';
import { PaymentModule } from './modules/payment.module';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { UserSubscription } from './entities/user-subscription.entity';
import { GeminiModule } from './modules/gemini.module';
import { ScheduleModule } from '@nestjs/schedule';
import { HomeController } from './controllers/home.controller';
import { Template } from './entities/template.entity';
import { Event } from './entities/event.entity';
import { Guest } from './entities/guest.entity';
import { Contact } from './entities/contact.entity';
import { Wish } from './entities/wish.entity';
import { TemplateModule } from './modules/template.module';
import { EventModule } from './modules/event.module';
import { ContactModule } from './modules/contact.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'mysql',
      driver: require('mysql2'),
      host: process.env.DB_HOST ?? '',
      port: parseInt(process.env.DB_PORT ?? '3306'),
      username: process.env.DB_USERNAME ?? '',
      password: process.env.DB_PASSWORD ?? '',
      database: process.env.DB_DATABASE ?? '',
      entities: [
        Feature,
        User,
        Media,
        Permission,
        Role,
        RefreshToken,
        Category,
        CategoryType,
        Article,
        Payment,
        MultiImage,
        AdvertisingSlider,
        Notification,
        NotificationConfig,
        FcmToken,
        InteractionStats,
        Page,
        Feedback,
        TopicSubscription,
        UserInteraction,
        SubscriptionPlan,
        UserSubscription,
        Template,
        Event,
        Guest,
        Contact,
        Wish,
      ],
      // synchronize: auto-update schema from entities (dev only).
      // migrationsRun: runs migrations on startup — InitialSchema runs before SeedsCommonData.
      // Do not enable both on a fresh DB: migrations run BEFORE synchronize, so seeds would fail.
      synchronize: process.env.TYPEORM_SYNCHRONIZE === 'true',
      migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
      migrationsRun: process.env.TYPEORM_MIGRATIONS_RUN !== 'false',
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
      logging: process.env.NODE_ENV === 'development' ? false : false,
      logger: process.env.NODE_ENV === 'development' ? 'advanced-console' : undefined,
    }),
    NotificationModule,
    CategoryModule,
    FeatureModule,
    ArticleModule,
    MediaModule,
    AuthModule,
    DashboardModule,
    UserInteractionModule,
    PageModule,
    FeedbackModule,
    ConverterModule,
    SubscriptionModule,
    PaymentModule,
    GeminiModule,
    TemplateModule,
    EventModule,
    ContactModule,
  ],
  controllers: [FcmController, DeepLinkController, HomeController],
})
export class AppModule { }
