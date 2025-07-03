import { Controller, Post, Get, Body, Param, UseGuards, Req, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PaymentService } from '../services/payment.service';
import { CreatePaymentDto, PaymentWebhookDto } from '../dtos/payment.dto';
import { GetCurrentUser } from '../decorators/get-current-user.decorator';
import { JwtPayload } from '../dtos/auth.dto';
import Stripe from 'stripe';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  async createPayment(
    @GetCurrentUser() user: JwtPayload,
    @Body() createPaymentDto: CreatePaymentDto,
  ) {
    return this.paymentService.createPayment(user.id, createPaymentDto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getPayment(@Param('id') id: string) {
    return this.paymentService.getPaymentById(parseInt(id));
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  async getPaymentsByUser(@Param('userId') userId: string) {
    return this.paymentService.getPaymentsByUser(parseInt(userId));
  }

  @Post('webhook/stripe')
  async handleStripeWebhook(
    @Body() event: PaymentWebhookDto,
    @Req() req: any,
    @Res() res: Response,
  ) {
    try {
      // Verify webhook signature in production
      // const signature = req.headers['stripe-signature'];
      // const verifiedEvent = this.stripe.webhooks.constructEvent(
      //   req.body,
      //   signature,
      //   process.env.STRIPE_WEBHOOK_SECRET
      // );

      await this.paymentService.handleStripeWebhook(event as Stripe.Event);
      res.status(HttpStatus.OK).json({ received: true });
    } catch (error) {
      res.status(HttpStatus.BAD_REQUEST).json({ error: error.message });
    }
  }

  @Post('webhook/vnpay')
  async handleVNPayWebhook(
    @Body() webhookData: any,
    @Res() res: Response,
  ) {
    try {
      // Handle VNPay webhook
      // Verify signature and update payment status
      res.status(HttpStatus.OK).json({ received: true });
    } catch (error) {
      res.status(HttpStatus.BAD_REQUEST).json({ error: error.message });
    }
  }

  @Post('webhook/momo')
  async handleMoMoWebhook(
    @Body() webhookData: any,
    @Res() res: Response,
  ) {
    try {
      // Handle MoMo webhook
      // Verify signature and update payment status
      res.status(HttpStatus.OK).json({ received: true });
    } catch (error) {
      res.status(HttpStatus.BAD_REQUEST).json({ error: error.message });
    }
  }

  @Post('webhook/zalopay')
  async handleZaloPayWebhook(
    @Body() webhookData: any,
    @Res() res: Response,
  ) {
    try {
      // Handle ZaloPay webhook
      // Verify signature and update payment status
      res.status(HttpStatus.OK).json({ received: true });
    } catch (error) {
      res.status(HttpStatus.BAD_REQUEST).json({ error: error.message });
    }
  }
} 