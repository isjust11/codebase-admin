import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { BaseController } from '../base/base.controller';
import { PaymentService } from '../../services/payment.service';
import { VNPayService } from '../../services/vnpay.service';
import { PaymentMethod } from '../../entities/payment.entity';

export class CreatePaymentDto {
  planId: number;
  paymentMethod: 'vnpay' | 'momo' | 'zalopay'; // Mở rộng thêm các gateway khác
  bankCode?: string; // Optional: mã ngân hàng cho VNPay
}

@Controller('payment')
export class PaymentController extends BaseController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly vnpayService: VNPayService,
  ) {
    super();
  }

  /**
   * Tạo payment và trả về URL thanh toán
   * POST /payment/create
   */
  @Post('create')
  @UseGuards(JwtAuthGuard)
  async createPayment(
    @Body() dto: CreatePaymentDto,
    @Req() req: any,
    @Res() res: Response,
  ) {
    try {
      const userId = req.user.userId;
      const ipAddress =
        req.headers['x-forwarded-for']?.toString().split(',')[0] ||
        req.connection.remoteAddress ||
        '127.0.0.1';

      // Tạo payment record trong DB
      const payment = await this.paymentService.createPayment({
        userId,
        planId: dto.planId,
        paymentMethod: this.mapPaymentMethod(dto.paymentMethod),
        ipAddress,
      });

      let paymentUrl: string;

      // Tạo payment URL theo gateway
      switch (dto.paymentMethod) {
        case 'vnpay':
          paymentUrl = this.vnpayService.createPaymentUrl({
            amount: payment.amount,
            orderInfo: `Thanh toan goi ${payment.plan.name} - User ${userId}`,
            orderType: 'billpayment',
            orderId: payment.transactionId,
            ipAddress,
            bankCode: dto.bankCode,
          });
          break;
        // case 'momo':
        //   paymentUrl = await this.momoService.createPaymentUrl(...);
        //   break;
        default:
          return this.error(res, {
            status: 400,
            message: 'Unsupported payment method',
          });
      }

      // Cập nhật payment URL
      await this.paymentService.updatePaymentUrl(payment.id, paymentUrl);

      return this.success(res, {
        paymentId: payment.id,
        transactionId: payment.transactionId,
        paymentUrl,
        amount: payment.amount,
      });
    } catch (error) {
      this.error(res, error);
    }
  }

  private mapPaymentMethod(method: CreatePaymentDto['paymentMethod']): PaymentMethod {
    switch (method) {
      case 'vnpay':
        return PaymentMethod.VNPAY;
      case 'momo':
        return PaymentMethod.MOMO;
      case 'zalopay':
        return PaymentMethod.ZALOPAY;
      default:
        return PaymentMethod.STRIPE;
    }
  }

  /**
   * VNPay Return URL (callback từ VNPay về app)
   * GET /payment/vnpay/callback?vnp_xxx=...
   * 
   * Lưu ý: Đây là callback cho app/web redirect, chỉ để hiển thị UI.
   * Không nên dựa vào đây để activate subscription vì có thể bị fake.
   * Dùng IPN (webhook) để xử lý chính thức.
   */
  @Get('vnpay/callback')
  async vnpayCallback(@Query() query: any, @Res() res: Response) {
    try {
      const verifyResult = this.vnpayService.verifyReturnUrl(query);

      if (!verifyResult.isValid) {
        // Redirect về app với error
        return res.redirect(
          `readbox://payment/result?status=error&message=${encodeURIComponent(verifyResult.message || 'Invalid signature')}`,
        );
      }

      const { orderId, isSuccess, responseCode } = verifyResult.data;

      if (isSuccess) {
        // Redirect về app với success
        return res.redirect(
          `readbox://payment/result?status=success&transactionId=${orderId}`,
        );
      } else {
        // Redirect về app với failed
        const errorMsg = this.vnpayService.getErrorMessage(responseCode);
        return res.redirect(
          `readbox://payment/result?status=failed&transactionId=${orderId}&message=${encodeURIComponent(errorMsg)}`,
        );
      }
    } catch (error) {
      return res.redirect(
        `readbox://payment/result?status=error&message=${encodeURIComponent(error.message)}`,
      );
    }
  }

  /**
   * VNPay IPN (webhook từ VNPay về backend)
   * GET /payment/vnpay/ipn?vnp_xxx=...
   * 
   * Đây là nơi xử lý chính thức: verify + activate subscription
   */
  @Get('vnpay/ipn')
  async vnpayIpn(@Query() query: any, @Res() res: Response) {
    try {
      const verifyResult = this.vnpayService.verifyReturnUrl(query);

      if (!verifyResult.isValid) {
        return res.status(200).json({ RspCode: '97', Message: 'Invalid Signature' });
      }

      const { orderId, amount, isSuccess, transactionNo } = verifyResult.data;

      // Tìm payment
      const payment = await this.paymentService.findByTransactionId(orderId);
      if (!payment) {
        return res.status(200).json({ RspCode: '01', Message: 'Order not found' });
      }

      // Kiểm tra đã xử lý chưa
      if (payment.status !== 'pending') {
        return res.status(200).json({ RspCode: '02', Message: 'Order already confirmed' });
      }

      // Kiểm tra số tiền
      if (Math.abs(payment.amount - amount) > 1) {
        return res.status(200).json({ RspCode: '04', Message: 'Invalid amount' });
      }

      if (isSuccess) {
        // Xử lý thanh toán thành công
        await this.paymentService.handlePaymentSuccess(
          payment.id,
          transactionNo,
        );
        return res.status(200).json({ RspCode: '00', Message: 'Success' });
      } else {
        // Xử lý thanh toán thất bại
        await this.paymentService.handlePaymentFailed(payment.id);
        return res.status(200).json({ RspCode: '00', Message: 'Confirmed' });
      }
    } catch (error) {
      console.error('VNPay IPN Error:', error);
      return res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
    }
  }

  /**
   * Kiểm tra trạng thái payment
   * GET /payment/:transactionId/status
   */
  @Get(':transactionId/status')
  @UseGuards(JwtAuthGuard)
  async getPaymentStatus(
    @Req() req: any,
    @Res() res: Response,
    @Param('transactionId') transactionId: string,
  ) {
    try {
      const userId = req.user.userId;
      const payment = await this.paymentService.findByTransactionId(transactionId);

      if (!payment || payment.userId !== userId) {
        return this.error(res, { status: 404, message: 'Payment not found' });
      }

      return this.success(res, {
        transactionId: payment.transactionId,
        status: payment.status,
        amount: payment.amount,
        createdAt: payment.createdAt,
        paidAt: payment.paidAt,
      });
    } catch (error) {
      this.error(res, error);
    }
  }
}
