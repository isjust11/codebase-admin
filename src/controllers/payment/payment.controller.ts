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
import { JwtAuthGuard, Public } from '../../guards/jwt-auth.guard';
import { BaseController } from '../base/base.controller';
import { PaymentService } from '../../services/payment.service';
import { VNPayService } from '../../services/vnpay.service';
import { PaymentMethod } from '../../entities/payment.entity';

export class CreatePaymentDto {
  planId: string;
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
      const userId = req.user.id;
      const ipAddress =
        req.headers['x-forwarded-for']?.toString().split(',')[0] ||
        req.connection.remoteAddress ||
        '127.0.0.1';
      const planId = this.decode(dto.planId);
      // Tạo payment record trong DB
      const payment = await this.paymentService.createPayment({
        userId,
        planId: planId,
        paymentMethod: this.mapPaymentMethod(dto.paymentMethod),
        ipAddress,
      });

      let paymentUrl: string;

      // Tạo payment URL theo gateway
      switch (dto.paymentMethod) {
        case 'vnpay':
          paymentUrl = this.vnpayService.createPaymentUrl({
            amount: payment.amount,
            orderInfo: `thanhtoan`,
            orderType: 'other',
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
   * VNPay Return URL – xử lý trên SERVER (không phải mobile).
   * Luồng: User thanh toán xong trên VNPay → VNPay redirect trình duyệt/WebView
   * đến URL này (GET /payment/vnpay/callback?vnp_xxx=...) → request tới server →
   * handler chạy trên server, verify, rồi response 302 redirect về readbox://payment/result.
   *
   * Bảo mật: Public (không JWT) là bắt buộc vì redirect không gửi được token.
   * Mọi request đều được verify chữ ký HMAC (vnp_SecureHash) với VNPAY_HASH_SECRET
   * trước khi xử lý. Không verify = redirect về status=error. Endpoint này chỉ redirect
   * về app (UI), không cập nhật DB/kích hoạt gói – việc đó do IPN đảm nhiệm.
   */
  @Public()
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
   * VNPay IPN – xử lý trên SERVER (server-to-server).
   * VNPay gọi GET /payment/vnpay/ipn?vnp_xxx=... từ máy chủ VNPay tới server ta.
   *
   * Bảo mật: Public (không JWT) vì VNPay server không có token của ta.
   * - Mọi request PHẢI verify chữ ký HMAC (vnp_SecureHash) với VNPAY_HASH_SECRET;
   *   sai chữ ký → RspCode 97, không cập nhật gì.
   * - Kiểm tra order tồn tại, số tiền khớp, status còn pending → tránh replay/giả mạo.
   * - VNPAY_HASH_SECRET chỉ lưu server-side, không đưa ra client/app.
   */
  @Public()
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
