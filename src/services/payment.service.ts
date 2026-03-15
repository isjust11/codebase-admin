import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentMethod, PaymentStatus } from '../entities/payment.entity';
import { UserSubscription, SubscriptionStatus } from '../entities/user-subscription.entity';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';

export interface CreatePaymentParams {
  userId: number;
  planId: number;
  paymentMethod: PaymentMethod;
  ipAddress: string;
}

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(UserSubscription)
    private userSubscriptionRepository: Repository<UserSubscription>,
    @InjectRepository(SubscriptionPlan)
    private planRepository: Repository<SubscriptionPlan>,
  ) { }

  /**
   * Tạo payment record mới
   */
  async createPayment(params: CreatePaymentParams): Promise<Payment> {
    // Lấy thông tin gói
    const plan = await this.planRepository.findOne({
      where: { id: params.planId },
    });
    if (!plan || !plan.isActive) {
      throw new Error('Plan not found or inactive');
    }

    // Tạo payment
    const payment = this.paymentRepository.create({
      userId: params.userId,
      planId: params.planId,
      amount: plan.price || 0,
      currency: 'VND',
      paymentMethod: params.paymentMethod,
      status: PaymentStatus.PENDING,
      transactionId: this.generateTransactionId(),
      ipAddress: params.ipAddress,
    });

    const savedPayment = await this.paymentRepository.save(payment);

    const queryBuilder = await this.paymentRepository.createQueryBuilder('payment')
      .innerJoinAndSelect('payment.plan', 'plan')
      .where('payment.id = :id', { id: savedPayment.id })
      .getOne();

    return queryBuilder as Payment;
  }

  /**
   * Cập nhật payment URL
   */
  async updatePaymentUrl(paymentId: number, paymentUrl: string): Promise<void> {
    await this.paymentRepository.update(paymentId, { paymentUrl });
  }

  async findAllPaginated(
    page: number,
    size: number,
    search?: string,
    status?: PaymentStatus,
    paymentMethod?: PaymentMethod,
  ): Promise<{ data: Payment[]; total: number }> {
    const qb = this.paymentRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.user', 'user')
      .leftJoinAndSelect('p.plan', 'plan')
      .orderBy('p.createdAt', 'DESC');

    if (status) {
      qb.andWhere('p.status = :status', { status });
    }
    if (paymentMethod) {
      qb.andWhere('p.paymentMethod = :paymentMethod', { paymentMethod });
    }
    if (search) {
      qb.andWhere(
        '(p.transactionId LIKE :search OR p.gatewayTransactionId LIKE :search OR user.fullName LIKE :s2 OR user.email LIKE :s2)',
        { search: `%${search}%`, s2: `%${search}%` },
      );
    }

    qb.skip((page - 1) * size).take(size);
    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async findById(id: number): Promise<Payment | null> {
    return this.paymentRepository.findOne({
      where: { id },
      relations: ['user', 'plan', 'userSubscription'],
    });
  }

  async adminUpdateStatus(id: number, status: PaymentStatus): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({ where: { id } });
    if (!payment) throw new Error('Payment not found');
    payment.status = status;
    if (status === PaymentStatus.REFUNDED) {
      payment.completedAt = new Date();
    }
    return this.paymentRepository.save(payment);
  }

  /**
   * Tìm payment theo transactionId
   */
  async findByTransactionId(transactionId: string): Promise<Payment | null> {
    return await this.paymentRepository.findOne({
      where: { transactionId },
      relations: ['plan'],
    });
  }

  /**
   * Xử lý thanh toán thành công
   */
  async handlePaymentSuccess(
    paymentId: number,
    gatewayTransactionId: string,
  ): Promise<void> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
      relations: ['plan'],
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    // Cập nhật payment
    payment.status = PaymentStatus.COMPLETED;
    payment.paidAt = new Date();
    payment.gatewayTransactionId = gatewayTransactionId;
    await this.paymentRepository.save(payment);

    // Tạo hoặc gia hạn subscription
    await this.activateSubscription(payment);
  }

  /**
   * Xử lý thanh toán thất bại
   */
  async handlePaymentFailed(paymentId: number): Promise<void> {
    await this.paymentRepository.update(paymentId, {
      status: PaymentStatus.FAILED,
    });
  }

  /**
   * Kích hoạt subscription cho user
   */
  private async activateSubscription(payment: Payment): Promise<void> {
    const plan = payment.plan;
    const userId = payment.userId;

    // Kiểm tra subscription hiện tại
    let subscription = await this.userSubscriptionRepository.findOne({
      where: { userId, planId: plan.id },
    });

    const now = new Date();
    let startedAt = now;
    let expiresAt: Date;

    // Tính expiration date
    if (plan.periodType === 'year') {
      expiresAt = new Date(now.setFullYear(now.getFullYear() + 1));
    } else {
      // month
      expiresAt = new Date(now.setMonth(now.getMonth() + 1));
    }

    if (subscription) {
      // Gia hạn subscription
      if (
        subscription.expiresAt &&
        subscription.expiresAt > new Date()
      ) {
        // Còn hạn: cộng thêm thời gian
        startedAt = subscription.expiresAt;
        if (plan.periodType === 'year') {
          expiresAt = new Date(startedAt.setFullYear(startedAt.getFullYear() + 1));
        } else {
          expiresAt = new Date(startedAt.setMonth(startedAt.getMonth() + 1));
        }
      }

      subscription.status = SubscriptionStatus.ACTIVE;
      subscription.startedAt = subscription.startedAt || new Date();
      subscription.expiresAt = expiresAt;
      subscription.paymentId = payment.id;
      subscription.currentPeriodKey = this.getCurrentPeriodKey(plan.periodType);

      await this.userSubscriptionRepository.save(subscription);
    } else {
      // Tạo subscription mới
      subscription = this.userSubscriptionRepository.create({
        userId,
        planId: plan.id,
        status: SubscriptionStatus.ACTIVE,
        startedAt: new Date(),
        expiresAt,
        paymentId: payment.id,
        storageUsedBytes: '0',
        ttsUsedInPeriod: 0,
        convertUsedInPeriod: 0,
        currentPeriodKey: this.getCurrentPeriodKey(plan.periodType),
      });

      await this.userSubscriptionRepository.save(subscription);
    }
  }

  /**
   * Generate unique transaction ID
   */
  private generateTransactionId(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TXN${timestamp}${random}`;
  }

  /**
   * Lấy period key hiện tại (VD: '2026-02' cho tháng 2/2026)
   */
  private getCurrentPeriodKey(periodType: string): string {
    const now = new Date();
    if (periodType === 'year') {
      return now.getFullYear().toString();
    }
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
  }

  async findByUserId(userId: number): Promise<Payment[]> {
    return await this.paymentRepository.find({
      where: { userId },
      relations: ['plan'],
      order: {
        createdAt: 'DESC',
      },
    });
  }
}
