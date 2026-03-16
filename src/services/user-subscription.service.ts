import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSubscription, SubscriptionStatus } from '../entities/user-subscription.entity';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';
import {
  CreateUserSubscriptionDto,
  IncrementUsageDto,
} from '../dtos/user-subscription.dto';
import { SubscriptionPlanEnum } from 'src/enums/subscription-plan.enum';

@Injectable()
export class UserSubscriptionService {
  constructor(
    @InjectRepository(UserSubscription)
    private readonly subscriptionRepository: Repository<UserSubscription>,
    @InjectRepository(SubscriptionPlan)
    private readonly planRepository: Repository<SubscriptionPlan>,
  ) { }

  /** Lấy gói đăng ký đang active của user (hoặc trial), ưu tiên expiresAt mới nhất */
  async getActiveSubscription(userId: number): Promise<UserSubscription | null> {
    const now = new Date();
    const subs = await this.subscriptionRepository
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.plan', 'plan')
      .where('s.userId = :userId', { userId })
      .andWhere('s.status IN (:...statuses)', {
        statuses: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL],
      })
      .andWhere('s.expiresAt >= :now', { now })
      .orderBy('s.expiresAt', 'DESC')
      .getMany();
    // get current active subscription
    const currentActiveSubscription = subs.find(s => s.status === SubscriptionStatus.ACTIVE
      && s.paymentId !== null
      && new Date(s.expiresAt).getTime() > now.getTime());
    if (!currentActiveSubscription) {
      // get next trial subscription
      const nextSubscription = subs.find(s => s.plan?.code === SubscriptionPlanEnum.FREE);
      return nextSubscription ?? null;
    }
    return currentActiveSubscription;
  }

  /** Lấy tất cả đăng ký của user (để admin hoặc lịch sử) */
  async getByUserId(userId: number): Promise<UserSubscription[]> {
    return this.subscriptionRepository.find({
      where: { userId },
      relations: ['plan', 'payment'],
      order: { createdAt: 'DESC' },
    });
  }

  /** Tạo đăng ký mới (user chọn gói → pending_payment hoặc trial) */
  async create(userId: number, dto: CreateUserSubscriptionDto): Promise<UserSubscription> {
    const plan = await this.planRepository.findOne({ where: { id: dto.planId } });
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }
    if (!plan.isActive) {
      throw new BadRequestException('Plan is not available');
    }

    const status = dto.status ?? SubscriptionStatus.PENDING_PAYMENT;
    const isTrial = status === SubscriptionStatus.TRIAL;
    const userSubscription = await this.subscriptionRepository.findOne({ where: { userId, planId: plan.id } });
    if (userSubscription) {
      throw new BadRequestException('User already has a subscription for this plan');
    }
    const sub = this.subscriptionRepository.create({
      userId,
      planId: plan.id,
      status,
      startedAt: new Date(),
      expiresAt: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      storageUsedBytes: '0',
      ttsUsedInPeriod: 0,
      convertUsedInPeriod: 0,
      currentPeriodKey: this.getCurrentPeriodKey(),
    });

    if (isTrial) {
      const now = new Date();
      sub.startedAt = now;
      sub.expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 ngày trial
    }

    return this.subscriptionRepository.save(sub);
  }

  /** Cập nhật trạng thái sau khi thanh toán thành công */
  async activateSubscription(
    subscriptionId: number,
    paymentId: number,
    durationMonths = 1,
  ): Promise<UserSubscription> {
    const sub = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
      relations: ['plan'],
    });
    if (!sub) {
      throw new NotFoundException('Subscription not found');
    }

    const now = new Date();
    sub.status = SubscriptionStatus.ACTIVE;
    sub.paymentId = paymentId;
    sub.startedAt = sub.startedAt ?? now;
    const expires = new Date(sub.startedAt);
    expires.setMonth(expires.getMonth() + durationMonths);
    sub.expiresAt = expires;
    sub.currentPeriodKey = this.getCurrentPeriodKey();

    return this.subscriptionRepository.save(sub);
  }

  /** Tăng usage (storage / TTS / convert) cho subscription đang active */
  async incrementUsage(
    userId: number,
    dto: IncrementUsageDto,
  ): Promise<UserSubscription | null> {
    const sub = await this.getActiveSubscription(userId);
    if (!sub) return null;

    const periodKey = this.getCurrentPeriodKey();
    if (sub.currentPeriodKey !== periodKey) {
      sub.currentPeriodKey = periodKey;
      sub.ttsUsedInPeriod = 0;
      sub.convertUsedInPeriod = 0;
      sub.storageUsedBytes = '0';
    }

    if (dto.storageBytes) {
      sub.storageUsedBytes = String(
        Number(sub.storageUsedBytes) + dto.storageBytes,
      );
    }
    if (dto.ttsCount) {
      sub.ttsUsedInPeriod += dto.ttsCount;
    }
    if (dto.convertCount) {
      sub.convertUsedInPeriod += dto.convertCount;
    }
    if (dto.downloadCount) {
      sub.downloadUsedInPeriod += dto.downloadCount;
    }
    if (dto.shareCount) {
      sub.shareUsedInPeriod += dto.shareCount;
    }

    await this.subscriptionRepository.save(sub);
    return sub;
  }

  /** Kiểm tra user còn quota TTS không */
  async canUseTts(userId: number): Promise<boolean> {
    const sub = await this.getActiveSubscription(userId);
    if (!sub) return false;
    const limit = sub.plan?.ttsLimitPerPeriod ?? 0;
    if (limit <= 0) return true; // unlimited
    return sub.ttsUsedInPeriod < limit;
  }

  /** Kiểm tra user còn quota convert không */
  async canUseConvert(userId: number): Promise<boolean> {
    const sub = await this.getActiveSubscription(userId);
    if (!sub) return false;
    const limit = sub.plan?.convertLimitPerPeriod ?? 0;
    if (limit <= 0) return true;
    return sub.convertUsedInPeriod < limit;
  }

  /** Kiểm tra user còn quota download không */
  async canUseDownload(userId: number): Promise<boolean> {
    const sub = await this.getActiveSubscription(userId);
    if (!sub) return false;
    const limit = sub.plan?.downloadLimitPerPeriod ?? 0;
    if (limit <= 0) return true;
    return sub.downloadUsedInPeriod < limit;
  }

  /** Kiểm tra user còn quota share không */
  async canUseShare(userId: number): Promise<boolean> {
    const sub = await this.getActiveSubscription(userId);
    if (!sub) return false;
    const limit = sub.plan?.shareLimitPerPeriod ?? 0;
    if (limit <= 0) return true;
    return sub.shareUsedInPeriod < limit;
  }

  /** Kiểm tra dung lượng storage còn đủ không (bytes) */
  async canUseStorage(userId: number, additionalBytes: number): Promise<boolean> {
    const sub = await this.getActiveSubscription(userId);
    if (!sub) return false;
    const limit = Number(sub.plan?.storageLimitBytes ?? 0);
    if (limit <= 0) return true;
    const used = Number(sub.storageUsedBytes ?? 0);
    return used + additionalBytes <= limit;
  }

  private getCurrentPeriodKey(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  async findAllPaginated(
    page: number,
    size: number,
    search?: string,
    status?: SubscriptionStatus,
  ): Promise<{ data: UserSubscription[]; total: number }> {
    const qb = this.subscriptionRepository
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.plan', 'plan')
      .leftJoinAndSelect('s.user', 'user')
      .leftJoinAndSelect('s.payment', 'payment')
      .orderBy('s.createdAt', 'DESC');

    if (status) {
      qb.andWhere('s.status = :status', { status });
    }
    if (search) {
      qb.andWhere(
        '(user.fullName LIKE :search OR user.email LIKE :search OR user.username LIKE :search)',
        { search: `%${search}%` },
      );
    }

    qb.skip((page - 1) * size).take(size);
    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async findById(id: number): Promise<UserSubscription> {
    const sub = await this.subscriptionRepository.findOne({
      where: { id },
      relations: ['plan', 'user', 'payment'],
    });
    if (!sub) {
      throw new NotFoundException('Subscription not found');
    }
    return sub;
  }

  /** Admin: đánh dấu hết hạn hoặc hủy */
  async updateStatus(
    id: number,
    status: SubscriptionStatus,
  ): Promise<UserSubscription> {
    const sub = await this.findById(id);
    sub.status = status;
    return this.subscriptionRepository.save(sub);
  }
}
