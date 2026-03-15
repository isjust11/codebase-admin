import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from '../entities/payment.entity';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';
import { UserSubscription } from '../entities/user-subscription.entity';
import { PaymentService } from '../services/payment.service';
import { VNPayService } from '../services/vnpay.service';
import { MomoService } from '../services/momo.service';
import { ZaloPayService } from '../services/zalopay.service';
import { StripeService } from '../services/stripe.service';
import { PayosService } from '../services/payos.service';
import { PaymentController } from '../controllers/payment/payment.controller';
import { AuthModule } from './auth.module';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([Payment, SubscriptionPlan, UserSubscription]),
  ],
  controllers: [PaymentController],
  providers: [PaymentService, VNPayService, MomoService, ZaloPayService, StripeService, PayosService],
  exports: [PaymentService],
})
export class PaymentModule { }

