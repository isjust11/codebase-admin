import { Controller, Post, Get, Body, Param, UseGuards, Req, Res, HttpStatus, UseInterceptors } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PaymentService } from '../services/payment.service';
import { CreatePaymentDto, PaymentWebhookDto } from '../dtos/payment.dto';
import { GetCurrentUser } from '../decorators/get-current-user.decorator';
import { JwtPayload } from '../dtos/auth.dto';
import Stripe from 'stripe';
import { RequirePermission } from 'src/decorators/require-permissions.decorator';
import { BaseController } from './base.controller';
import { EncryptionInterceptor } from 'src/interceptors/encryption.interceptor';
import { PermissionGuard } from 'src/guards/permission.guard';

@Controller('payments')
@UseGuards(JwtAuthGuard)
@UseGuards(PermissionGuard)
export class PaymentController extends BaseController{
  constructor(private readonly paymentService: PaymentService) {
    super();
  }

  @Post('create')
  @RequirePermission('CREATE', 'payment')
  async createPayment(
    @GetCurrentUser() user: JwtPayload,
    @Body() createPaymentDto: CreatePaymentDto,
  ) {
    return this.paymentService.createPayment(user.id, createPaymentDto);
  }

  @Get(':id')
  @RequirePermission('READ', 'payment')
  async getPayment(@Param('id') id: string) {
    return this.paymentService.getPaymentById(parseInt(id));
  }

  @Get('user/:userId')
  @RequirePermission('READ', 'payment')
  async getPaymentsByUser(@Param('userId') userId: string) {
    return this.paymentService.getPaymentsByUser(parseInt(userId));
  }

  @Post('webhook/stripe')
  @RequirePermission('UPDATE', 'payment')
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
  @RequirePermission('UPDATE', 'payment')
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
  @RequirePermission('UPDATE', 'payment')
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
  @RequirePermission('UPDATE', 'payment')
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