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

      // Bỏ qua event từ Sandbox trên môi trường Production
      const isProduction = process.env.NODE_ENV === 'production';
      if (isProduction && environment === 'SANDBOX') {
        this.logger.warn(`Bỏ qua SANDBOX event trong Production: ${type} for appUserId=${appUserId}`);
        return;
      }

      // Kiểm tra app_user_id có phải số nguyên hợp lệ không (tránh Anonymous ID)
      const userIdNum = parseInt(appUserId, 10);
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
      // Conventions: 'readbox_pro_monthly', 'readbox_ultra_annual', 'readbox_lifetime'
      const plan = await this.resolvePlanFromProductId(productId);

      if (!plan) {
        this.logger.warn(
          `SubscriptionPlan not found for RC product_id: "${productId}". ` +
          `Kiểm tra lại product ID trên RevenueCat Dashboard và bảng subscription_plans.`,
        );
        return;
      }

      switch (type) {
        case 'INITIAL_PURCHASE':
        case 'NON_RENEWING_PURCHASE':
          await this.handlePurchase(user.id, plan.id, purchasedAtMs, expirationAtMs, false);
          break;

        case 'RENEWAL':
          // Khi gia hạn, reset lại usage trong kỳ
          await this.handlePurchase(user.id, plan.id, purchasedAtMs, expirationAtMs, true);
          break;

        case 'CANCELLATION':
          await this.handleCancellation(user.id, plan.id, expirationAtMs);
          break;

        case 'EXPIRATION':
          await this.handleExpiration(user.id, plan.id);
          break;

        case 'UNCANCELLATION':
          // Người dùng hủy xong nhưng đổi ý, reactivate lại
          await this.handleUncancellation(user.id, plan.id);
          break;

        case 'BILLING_ISSUES_DETECTED':
          // Thanh toán gặp vấn đề (thẻ hết hạn, không đủ tiền...)
          await this.handleBillingIssue(user.id, plan.id);
          break;

        case 'PRODUCT_CHANGE':
          // Người dùng đổi gói (VD: Monthly → Annual)
          this.logger.log(`User ${user.id} changed product to: ${productId}`);
          break;

        case 'TRANSFER':
          // Transfer giữa các app user ID, thường do restore purchases
          this.logger.log(`Transfer event for user ${user.id}, product: ${productId}`);
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

  /**
   * Resolve SubscriptionPlan từ productId một cách an toàn.
   * Ưu tiên match trực tiếp với code trong DB, thay vì split cứng nhắc.
   */
  private async resolvePlanFromProductId(productId: string): Promise<SubscriptionPlan | null> {
    if (!productId) return null;

    // Lấy tất cả plans và tìm match
    const allPlans = await this.planRepository.find({ where: { isActive: true } });
    const productIdLower = productId.toLowerCase();

    // Tìm theo cách match code trong productId
    // VD: 'readbox_pro_monthly' match với plan code 'PRO'
    for (const plan of allPlans) {
      if (productIdLower.includes(plan.code.toLowerCase())) {
        return plan;
      }
    }

    // Fallback: query trực tiếp nếu productId chính là code
    return this.planRepository
      .createQueryBuilder('p')
      .where('UPPER(p.code) = :code', { code: productId.toUpperCase() })
      .getOne();
  }

  private async handlePurchase(
    userId: number,
    planId: number,
    purchasedAtMs: number,
    expirationAtMs: number,
    isRenewal: boolean,
  ) {
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

      await this.subscriptionRepository.save(existingActive);
      this.logger.log(`${isRenewal ? 'Renewed' : 'Updated'} plan ${planId} for user ${userId} until ${expiresAt}`);
      return;
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

    await this.subscriptionRepository.save(sub);
    this.logger.log(`Activated plan ${planId} for user ${userId} until ${expiresAt}`);
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
