import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { Payment, PaymentStatus, PaymentMethod } from '../entities/payment.entity';
import { CreatePaymentDto, UpdatePaymentStatusDto, PaymentResponseDto } from '../dtos/payment.dto';
import { User } from '../entities/user.entity';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private stripe: Stripe;

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private configService: ConfigService,
  ) {
    // Initialize Stripe with test keys
    const stripeKey = this.configService.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY is required');
    }
    this.stripe = new Stripe(stripeKey, {
      apiVersion: '2025-06-30.basil',
    });
  }

  async createPayment(userId: number, createPaymentDto: CreatePaymentDto): Promise<PaymentResponseDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Create payment record
    const payment = new Payment();
    payment.userId = userId;
    payment.amount = createPaymentDto.amount;
    payment.currency = createPaymentDto.currency || 'VND';
    payment.paymentMethod = createPaymentDto.paymentMethod;
    payment.description = createPaymentDto.description || '';
    payment.metadata = createPaymentDto.metadata ? JSON.stringify(createPaymentDto.metadata) : '';
    payment.status = PaymentStatus.PENDING;

    const savedPayment = await this.paymentRepository.save(payment);

    // Process payment based on method
    switch (createPaymentDto.paymentMethod) {
      case PaymentMethod.STRIPE:
        return this.processStripePayment(savedPayment);
      case PaymentMethod.VNPAY:
        return this.processVNPayPayment(savedPayment);
      case PaymentMethod.MOMO:
        return this.processMoMoPayment(savedPayment);
      case PaymentMethod.ZALOPAY:
        return this.processZaloPayPayment(savedPayment);
      default:
        throw new BadRequestException('Unsupported payment method');
    }
  }

  private async processStripePayment(payment: Payment): Promise<PaymentResponseDto> {
    try {
      // Convert VND to cents (Stripe uses smallest currency unit)
      const amountInCents = Math.round(payment.amount * 100);

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'vnd',
        metadata: {
          paymentId: payment.id.toString(),
          userId: payment.userId.toString(),
        },
        description: payment.description,
      });

      // Update payment with Stripe payment intent ID
      await this.paymentRepository.update(payment.id, {
        paymentIntentId: paymentIntent.id,
        gatewayResponse: JSON.stringify(paymentIntent),
      });

      return {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        paymentMethod: payment.paymentMethod,
        status: payment.status,
        paymentIntentId: paymentIntent.id,
        description: payment.description,
        createdAt: payment.createdAt,
        clientSecret: paymentIntent.client_secret || '',
      };
    } catch (error) {
      this.logger.error('Stripe payment creation failed:', error);
      await this.updatePaymentStatus(payment.id, {
        status: PaymentStatus.FAILED,
        failureReason: error.message,
      });
      throw new BadRequestException('Payment creation failed');
    }
  }

  private async processVNPayPayment(payment: Payment): Promise<PaymentResponseDto> {
    // VNPay integration for test environment
    const vnpayUrl = this.configService.get('VNPAY_PAYMENT_URL') || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    const vnpTmnCode = this.configService.get('VNPAY_TMN_CODE') || 'test';
    const vnpHashSecret = this.configService.get('VNPAY_HASH_SECRET') || 'test';

    // Generate VNPay payment URL (simplified for demo)
    const paymentUrl = `${vnpayUrl}?vnp_Amount=${payment.amount * 100}&vnp_Command=pay&vnp_TxnRef=${payment.id}&vnp_TmnCode=${vnpTmnCode}`;

    return {
      id: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      paymentMethod: payment.paymentMethod,
      status: payment.status,
      description: payment.description,
      createdAt: payment.createdAt,
      paymentUrl,
    };
  }

  private async processMoMoPayment(payment: Payment): Promise<PaymentResponseDto> {
    // MoMo integration for test environment
    const momoUrl = this.configService.get('MOMO_PAYMENT_URL') || 'https://test-payment.momo.vn/v2/gateway/api/create';
    
    // Generate MoMo payment URL (simplified for demo)
    const paymentUrl = `${momoUrl}?amount=${payment.amount}&orderId=${payment.id}&orderInfo=${payment.description || 'Payment'}`;

    return {
      id: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      paymentMethod: payment.paymentMethod,
      status: payment.status,
      description: payment.description,
      createdAt: payment.createdAt,
      paymentUrl,
    };
  }

  private async processZaloPayPayment(payment: Payment): Promise<PaymentResponseDto> {
    // ZaloPay integration for test environment
    const zalopayUrl = this.configService.get('ZALOPAY_PAYMENT_URL') || 'https://sandbox.zalopay.com.vn/v001/tpe/createorder';
    
    // Generate ZaloPay payment URL (simplified for demo)
    const paymentUrl = `${zalopayUrl}?amount=${payment.amount}&app_trans_id=${payment.id}&description=${payment.description || 'Payment'}`;

    return {
      id: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      paymentMethod: payment.paymentMethod,
      status: payment.status,
      description: payment.description,
      createdAt: payment.createdAt,
      paymentUrl,
    };
  }

  async updatePaymentStatus(paymentId: number, updateDto: UpdatePaymentStatusDto): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({ where: { id: paymentId } });
    if (!payment) {
      throw new BadRequestException('Payment not found');
    }

    const updateData: any = {
      status: updateDto.status,
      gatewayResponse: updateDto.gatewayResponse ? JSON.stringify(updateDto.gatewayResponse) : payment.gatewayResponse,
    };

    if (updateDto.transactionId) {
      updateData.transactionId = updateDto.transactionId;
    }

    if (updateDto.failureReason) {
      updateData.failureReason = updateDto.failureReason;
    }

    if (updateDto.status === PaymentStatus.COMPLETED) {
      updateData.completedAt = new Date();
    }

    await this.paymentRepository.update(paymentId, updateData);
    const updatedPayment = await this.paymentRepository.findOne({ where: { id: paymentId } });
    if (!updatedPayment) {
      throw new BadRequestException('Payment not found after update');
    }
    return updatedPayment;
  }

  async handleStripeWebhook(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await this.handlePaymentSuccess(paymentIntent.metadata.paymentId, {
          status: PaymentStatus.COMPLETED,
          transactionId: paymentIntent.id,
          gatewayResponse: paymentIntent,
        });
        break;

      case 'payment_intent.payment_failed':
        const failedPaymentIntent = event.data.object as Stripe.PaymentIntent;
        await this.handlePaymentFailure(failedPaymentIntent.metadata.paymentId, {
          status: PaymentStatus.FAILED,
          failureReason: failedPaymentIntent.last_payment_error?.message || 'Payment failed',
          gatewayResponse: failedPaymentIntent,
        });
        break;
    }
  }

  private async handlePaymentSuccess(paymentId: string, updateData: UpdatePaymentStatusDto): Promise<void> {
    await this.updatePaymentStatus(parseInt(paymentId), updateData);
    this.logger.log(`Payment ${paymentId} completed successfully`);
  }

  private async handlePaymentFailure(paymentId: string, updateData: UpdatePaymentStatusDto): Promise<void> {
    await this.updatePaymentStatus(parseInt(paymentId), updateData);
    this.logger.error(`Payment ${paymentId} failed: ${updateData.failureReason}`);
  }

  async getPaymentById(paymentId: number): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({ 
      where: { id: paymentId },
      relations: ['user']
    });
    
    if (!payment) {
      throw new BadRequestException('Payment not found');
    }
    
    return payment;
  }

  async getPaymentsByUser(userId: number): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }
} 