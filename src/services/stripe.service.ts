import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';

export interface StripeConfig {
  secretKey: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CreateStripeCheckoutDto {
  amount: number;
  currency: string;
  transactionId: string;
  customerEmail?: string;
}

@Injectable()
export class StripeService {
  private stripe: Stripe;
  private config: StripeConfig;

  constructor() {
    const secretKey = (process.env.STRIPE_SECRET_KEY || '').trim();
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    this.stripe = new Stripe(secretKey, {
      // apiVersion: '2025-06-30.basil',
    });

    this.config = {
      secretKey,
      successUrl:
        (process.env.STRIPE_SUCCESS_URL ||
          'http://localhost:4000/payment/stripe/return') + '?session_id={CHECKOUT_SESSION_ID}',
      cancelUrl:
        (process.env.STRIPE_CANCEL_URL ||
          'http://localhost:4000/payment/stripe/cancel') + '?session_id={CHECKOUT_SESSION_ID}',
    };
  }

  /**
   * Tạo Stripe Checkout Session và trả về URL để redirect
   */
  async createCheckoutSession(
    params: CreateStripeCheckoutDto,
  ): Promise<{ url: string; id: string }> {
    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: params.currency,
            product_data: {
              name: 'Readbox subscription',
            },
            // Stripe yêu cầu số nguyên (đơn vị nhỏ nhất của tiền tệ)
            unit_amount: Math.round(params.amount),
          },
          quantity: 1,
        },
      ],
      success_url: this.config.successUrl,
      cancel_url: this.config.cancelUrl,
      metadata: {
        transactionId: params.transactionId,
      },
    });

    if (!session.url) {
      throw new Error('Failed to create Stripe Checkout Session');
    }

    return { url: session.url, id: session.id };
  }
}

