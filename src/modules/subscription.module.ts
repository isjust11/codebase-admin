import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';
import { UserSubscription } from '../entities/user-subscription.entity';
import { SubscriptionPlanService } from '../services/subscription-plan.service';
import { UserSubscriptionService } from '../services/user-subscription.service';
import { SubscriptionPlanController } from '../controllers/subscription/subscription-plan.controller';
import { UserSubscriptionController } from '../controllers/subscription/user-subscription.controller';
import { AuthModule } from './auth.module';
import { RevenueCatWebhookController } from '../controllers/subscription/revenuecat-webhook.controller';
import { RevenueCatWebhookService } from '../services/revenuecat-webhook.service';
import { User } from '../entities/user.entity';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([SubscriptionPlan, UserSubscription, User]),
  ],
  controllers: [SubscriptionPlanController, UserSubscriptionController, RevenueCatWebhookController],
  providers: [SubscriptionPlanService, UserSubscriptionService, RevenueCatWebhookService],
  exports: [SubscriptionPlanService, UserSubscriptionService],
})
export class SubscriptionModule { }
