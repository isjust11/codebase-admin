import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSubscription, SubscriptionStatus } from '../entities/user-subscription.entity';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';
import { User } from '../entities/user.entity';
import { Payment, PaymentMethod, PaymentStatus } from '../entities/payment.entity';
import { Base64EncryptionUtil } from 'src/utils/base64Encryption.util';

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
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) { }

  async handleWebhook(body: any) {
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
      const amount = event.price || 0;
      const currency = event.currency || 'USD';
      const transactionId = event.transaction_id || '';

      // Bỏ qua event từ Sandbox trên môi trường Production
      const isProduction = process.env.NODE_ENV === 'production';
      if (isProduction && environment === 'SANDBOX') {
        this.logger.warn(`Bỏ qua SANDBOX event trong Production: ${type} for appUserId=${appUserId}`);
        return;
      }

      // Kiểm tra app_user_id có phải số nguyên hợp lệ không (tránh Anonymous ID)
      const userIdNum = Base64EncryptionUtil.decrypt(appUserId);
      if (isNaN(userIdNum)) {
        this.logger.warn(
          `Bỏ qua Webhook: app_user_id "${appUserId}" không phải số nguyên. ` +
          `Có thể là Anonymous User chưa login vào hệ thống.`,
        );
        return;
      }

      // Ensure user exists
      const user = await this.userRepository.findOne({
        where: { id: userIdNum },
      });

      if (!user) {
        this.logger.warn(`User not found for app_user_id: ${appUserId}`);
        return;
      }

      // Map productId sang planCode an toàn hơn
      // Conventions: 'readbox_pro_monthly', 'readbox_pro_year'
      const parts = productId.split('_');
      const productCode = parts[1]; // 'pro'
      const periodRaw = parts[2];   // 'monthly' hoặc 'year'
      const productCodeName = productCode.toUpperCase() + '_' + periodRaw.toUpperCase();
      // Chuẩn hóa period sang 'month' hoặc 'year' để khớp với database
      const dbPeriod = periodRaw === 'monthly' ? 'month' : 'year';

      const plan = await this.resolvePlanFromProductId(productCodeName, dbPeriod);

      if (!plan) {
        this.logger.warn(
          `SubscriptionPlan not found for RC product_id: "${productId}". ` +
          `Kiểm tra lại product ID trên RevenueCat Dashboard và bảng subscription_plans.`,
        );
        return;
      }
      let subscriptionActive;
      switch (type) {
        case 'INITIAL_PURCHASE':
        case 'NON_RENEWING_PURCHASE':
          subscriptionActive = await this.handlePurchase(user.id, plan.id, plan.periodType, purchasedAtMs, expirationAtMs, false, amount, currency, transactionId);
          break;

        case 'RENEWAL':
          // Khi gia hạn, reset lại usage trong kỳ
          subscriptionActive = await this.handlePurchase(user.id, plan.id, plan.periodType, purchasedAtMs, expirationAtMs, true, amount, currency, transactionId);
          break;

        case 'CANCELLATION':
          subscriptionActive = await this.handleCancellation(user.id, plan.id, expirationAtMs);
          break;

        case 'EXPIRATION':
          subscriptionActive = await this.handleExpiration(user.id, plan.id);
          break;

        case 'UNCANCELLATION':
          // Người dùng hủy xong nhưng đổi ý, reactivate lại
          subscriptionActive = await this.handleUncancellation(user.id, plan.id);
          break;

        case 'BILLING_ISSUES_DETECTED':
          // Thanh toán gặp vấn đề (thẻ hết hạn, không đủ tiền...)
          subscriptionActive = await this.handleBillingIssue(user.id, plan.id);
          break;

        case 'PRODUCT_CHANGE':
          // Người dùng đổi gói (VD: Monthly → Annual)
          this.logger.log(`User ${user.id} changed product to: ${productId}`);
          subscriptionActive = await this.handlePurchase(user.id, plan.id, plan.periodType, purchasedAtMs, expirationAtMs, false, amount, currency, transactionId);
          break;

        default:
          this.logger.log(`Unhandled RevenueCat event type: ${type}`);
          break;
      }
      return subscriptionActive;
    } catch (error) {
      this.logger.error(`Error processing RevenueCat webhook: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Resolve SubscriptionPlan từ productId một cách an toàn.
   * Lọc theo cả code và periodType (month/year)
   */
  private async resolvePlanFromProductId(productCode: string, periodType: string): Promise<SubscriptionPlan | null> {
    if (!productCode) return null;

    // Tìm gói active có code và periodType khớp
    return this.planRepository.findOne({
      where: {
        code: productCode as any,
        periodType: periodType,
        isActive: true
      }
    });
  }

  private async handlePurchase(
    userId: number,
    planId: number,
    planPeriod: string,
    purchasedAtMs: number,
    expirationAtMs: number,
    isRenewal: boolean,
    amount: number,
    currency: string,
    transactionId: string,
  ) {
    const startedAt = purchasedAtMs ? new Date(Number(purchasedAtMs)) : new Date();
    let expiresAt = new Date();

    if (expirationAtMs) {
      expiresAt = new Date(Number(expirationAtMs));
    } else {
      // fallback assumption if no expiration provided
      if (planPeriod === 'month') {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      } else if (planPeriod === 'year') {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      }
    }

    // Deactivate previous active plans if necessary, or just insert new
    const existingActive = await this.subscriptionRepository.findOne({
      where: { userId, status: SubscriptionStatus.ACTIVE },
    });

    if (existingActive && existingActive.planId !== planId) {
      // Đổi sang gói khác → expire gói cũ
      existingActive.status = SubscriptionStatus.EXPIRED;
      await this.subscriptionRepository.save(existingActive);
    } else if (existingActive && existingActive.planId === planId) {
      // Gia hạn cùng gói
      existingActive.expiresAt = expiresAt;
      existingActive.updatedAt = new Date();

      if (isRenewal) {
        // Reset usage counters khi gia hạn
        existingActive.ttsUsedInPeriod = 0;
        existingActive.convertUsedInPeriod = 0;
        existingActive.downloadUsedInPeriod = 0;
        existingActive.shareUsedInPeriod = 0;
        existingActive.storageUsedBytes = '0';
        existingActive.currentPeriodKey = this.getCurrentPeriodKey();
      }

      const subscriptionActive = await this.subscriptionRepository.save(existingActive);
      this.logger.log(`${isRenewal ? 'Renewed' : 'Updated'} plan ${planId} for user ${userId} until ${expiresAt}`);
      return subscriptionActive;
    }

    // Tạo subscription mới
    const sub = this.subscriptionRepository.create({
      userId,
      planId,
      status: SubscriptionStatus.ACTIVE,
      startedAt,
      expiresAt,
      storageUsedBytes: '0',
      ttsUsedInPeriod: 0,
      convertUsedInPeriod: 0,
      downloadUsedInPeriod: 0,
      shareUsedInPeriod: 0,
      currentPeriodKey: this.getCurrentPeriodKey(),
    });

    const subscriptionActive = await this.subscriptionRepository.save(sub);
    this.logger.log(`Activated plan ${planId} for user ${userId} until ${expiresAt}`);

    // Lưu thông tin thanh toán
    await this.savePayment(userId, planId, subscriptionActive.id, amount, currency, transactionId);

    return subscriptionActive;
  }

  private async savePayment(
    userId: number,
    planId: number,
    userSubscriptionId: number,
    amount: number,
    currency: string,
    transactionId: string,
  ) {
    try {
      const payment = this.paymentRepository.create({
        userId,
        planId,
        userSubscriptionId,
        amount,
        currency,
        paymentMethod: PaymentMethod.REVENUECAT,
        status: PaymentStatus.COMPLETED,
        transactionId,
        gatewayTransactionId: transactionId,
        paidAt: new Date(),
        description: `RevenueCat Payment for plan ${planId}`,
        completedAt: new Date(),
      });

      await this.paymentRepository.save(payment);
      this.logger.log(`Saved RevenueCat Payment: ${transactionId} for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to save RevenueCat Payment: ${error.message}`);
    }
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
        existingActive.status = SubscriptionStatus.CANCELLED;
        if (expirationAtMs) {
          existingActive.expiresAt = new Date(Number(expirationAtMs));
        }
      }
      await this.subscriptionRepository.save(existingActive);
      this.logger.log(`Cancelled plan ${planId} for user ${userId}`);
    }
  }

  private async handleExpiration(userId: number, planId: number) {
    const existing = await this.subscriptionRepository.findOne({
      where: { userId, planId },
    });

    if (existing && existing.status !== SubscriptionStatus.EXPIRED) {
      existing.status = SubscriptionStatus.EXPIRED;
      await this.subscriptionRepository.save(existing);
      this.logger.log(`Expired plan ${planId} for user ${userId}`);
    }
  }

  private async handleUncancellation(userId: number, planId: number) {
    const existing = await this.subscriptionRepository.findOne({
      where: { userId, planId, status: SubscriptionStatus.CANCELLED },
    });

    if (existing) {
      existing.status = SubscriptionStatus.ACTIVE;
      await this.subscriptionRepository.save(existing);
      this.logger.log(`Uncancelled plan ${planId} for user ${userId}`);
    }
  }

  private async handleBillingIssue(userId: number, planId: number) {
    const existing = await this.subscriptionRepository.findOne({
      where: { userId, planId, status: SubscriptionStatus.ACTIVE },
    });

    if (existing) {
      existing.status = SubscriptionStatus.PAYMENT_FAILED;
      await this.subscriptionRepository.save(existing);
      this.logger.warn(`Billing issue detected for plan ${planId}, user ${userId}`);
      // TODO: Gửi push notification / email thông báo thanh toán thất bại cho user
    }
  }

  /** Tạo key cho kỳ hiện tại, VD: '2025-04' */
  private getCurrentPeriodKey(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
}
