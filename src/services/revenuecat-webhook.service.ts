import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSubscription, SubscriptionStatus } from '../entities/user-subscription.entity';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class RevenueCatWebhookService {
  private readonly logger = new Logger(RevenueCatWebhookService.name);

  constructor(
    @InjectRepository(UserSubscription)
    private readonly subscriptionRepository: Repository<UserSubscription>,
    @InjectRepository(SubscriptionPlan)
    private readonly planRepository: Repository<SubscriptionPlan>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async handleWebhook(body: any): Promise<void> {
    try {
      this.logger.log(`Received RevenueCat Webhook: ${JSON.stringify(body)}`);

      const event = body.event;
      if (!event) {
        throw new BadRequestException('No event found in webhook body');
      }

      const type = event.type;
      const appUserId = event.app_user_id;
      const productId = event.product_id;
      const environment = event.environment; // 'PRODUCTION' or 'SANDBOX'
      const purchasedAtMs = event.purchased_at_ms;
      const expirationAtMs = event.expiration_at_ms;

      // Ensure user exists
      const user = await this.userRepository.findOne({
        where: { id: Number(appUserId) },
      });

      if (!user) {
        this.logger.warn(`User not found for app_user_id: ${appUserId}`);
        return;
      }

      // Map RevenueCat productId to our internal SubscriptionPlan
      // For example, productId from RC could be 'readbox_pro_monthly'
      // You may need to adapt this logic if you have specific product IDs.
      let planCodeStr = productId.split('_')[1]; // e.g. readbox_pro_monthly -> pro
      if (!planCodeStr) planCodeStr = 'PRO';
      planCodeStr = planCodeStr.toUpperCase();

      const plan = await this.planRepository.createQueryBuilder('p')
        .where('UPPER(p.code) = :code', { code: planCodeStr })
        .getOne();

      if (!plan) {
        this.logger.warn(`SubscriptionPlan not found for RC product_id: ${productId} mapped to ${planCodeStr}`);
        return;
      }

      switch (type) {
        case 'INITIAL_PURCHASE':
        case 'RENEWAL':
        case 'NON_RENEWING_PURCHASE':
          await this.handlePurchase(user.id, plan.id, purchasedAtMs, expirationAtMs, event);
          break;

        case 'CANCELLATION':
        case 'EXPIRATION':
          await this.handleCancellation(user.id, plan.id, expirationAtMs);
          break;

        default:
          this.logger.log(`Unhandled RevenueCat event type: ${type}`);
          break;
      }
    } catch (error) {
      this.logger.error(`Error processing RevenueCat webhook: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async handlePurchase(userId: number, planId: number, purchasedAtMs: number, expirationAtMs: number, event: any) {
    const startedAt = purchasedAtMs ? new Date(Number(purchasedAtMs)) : new Date();
    let expiresAt = new Date();
    
    if (expirationAtMs) {
      expiresAt = new Date(Number(expirationAtMs));
    } else {
      // fallback assumption if no expiration provided
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    }

    // Deactivate previous active plans if necessary, or just insert new
    const existingActive = await this.subscriptionRepository.findOne({
      where: { userId, status: SubscriptionStatus.ACTIVE },
    });
    
    if (existingActive && existingActive.planId !== planId) {
       existingActive.status = SubscriptionStatus.EXPIRED;
       await this.subscriptionRepository.save(existingActive);
    } else if (existingActive && existingActive.planId === planId) {
       existingActive.expiresAt = expiresAt;
       existingActive.updatedAt = new Date();
       await this.subscriptionRepository.save(existingActive);
       return;
    }

    const sub = this.subscriptionRepository.create({
      userId,
      planId,
      status: SubscriptionStatus.ACTIVE,
      startedAt,
      expiresAt,
      storageUsedBytes: '0',
      ttsUsedInPeriod: 0,
      convertUsedInPeriod: 0,
    });

    await this.subscriptionRepository.save(sub);
    this.logger.log(`Activated/Renewed plan ${planId} for user ${userId} until ${expiresAt}`);
  }

  private async handleCancellation(userId: number, planId: number, expirationAtMs: number) {
     const existingActive = await this.subscriptionRepository.findOne({
      where: { userId, planId, status: SubscriptionStatus.ACTIVE },
    });

    if (existingActive) {
      if (expirationAtMs && new Date(Number(expirationAtMs)).getTime() <= new Date().getTime()) {
         existingActive.status = SubscriptionStatus.EXPIRED;
      } else {
         // It's cancelled but might still be valid until expiration
         // We can leave it ACTIVE until a cron job expires it, or set to CANCELLED depending on biz logic
         existingActive.status = SubscriptionStatus.CANCELLED;
         if (expirationAtMs) {
             existingActive.expiresAt = new Date(Number(expirationAtMs));
         }
      }
      await this.subscriptionRepository.save(existingActive);
      this.logger.log(`Cancelled/Expired plan ${planId} for user ${userId}`);
    }
  }
}
