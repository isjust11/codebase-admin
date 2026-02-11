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
import { MomoService } from '../../services/momo.service';
import { ZaloPayService } from '../../services/zalopay.service';
import { StripeService } from '../../services/stripe.service';
import { PaymentMethod } from '../../entities/payment.entity';

export class CreatePaymentDto {
  planId: string;
  paymentMethod: 'stripe' | 'vnpay' | 'momo' | 'zalopay'; // Mở rộng thêm các gateway khác
  bankCode?: string; // Optional: mã ngân hàng cho VNPay
}

@Controller('payment')
export class PaymentController extends BaseController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly vnpayService: VNPayService,
    private readonly momoService: MomoService,
    private readonly zaloPayService: ZaloPayService,
    private readonly stripeService: StripeService,
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
        case 'stripe':
          const stripeSession = await this.stripeService.createCheckoutSession({
            amount: payment.amount,
            currency: 'vnd',
            transactionId: payment.transactionId,
          });
          paymentUrl = stripeSession.url;
          break;
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
        case 'momo':
          paymentUrl = await this.momoService.createPaymentUrl({
            amount: payment.amount,
            orderInfo: `thanhtoan`,
            orderId: payment.transactionId,
          });
          break;
        case 'zalopay':
          paymentUrl = await this.zaloPayService.createPaymentUrl({
            amount: payment.amount,
            description: 'thanhtoan',
            orderId: payment.transactionId,
            userId: userId,
          });
          break;
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
      case 'stripe':
        return PaymentMethod.STRIPE;
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
   * MoMo callback – chỉ dùng để redirect về app, không cập nhật DB.
   * MoMo sẽ redirect người dùng về URL này sau khi thanh toán xong.
   */
  @Public()
  @Get('momo/callback')
  async momoCallback(@Query() query: any, @Res() res: Response) {
    try {
      const isValid = this.momoService.verifySignature(query);

      if (!isValid) {
        return res.redirect(
          `readbox://payment/result?status=error&message=${encodeURIComponent(
            'Invalid MoMo signature',
          )}`,
        );
      }

      const { orderId, resultCode, message } = query;
      const isSuccess = Number(resultCode) === 0;

      if (isSuccess) {
        return res.redirect(
          `readbox://payment/result?status=success&transactionId=${orderId}`,
        );
      }

      return res.redirect(
        `readbox://payment/result?status=failed&transactionId=${orderId}&message=${encodeURIComponent(
          message || 'Payment failed',
        )}`,
      );
    } catch (error) {
      return res.redirect(
        `readbox://payment/result?status=error&message=${encodeURIComponent(
          error.message,
        )}`,
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
   * MoMo IPN – MoMo gọi POST JSON đến URL này từ server MoMo.
   * Endpoint này mới là nơi cập nhật DB và kích hoạt gói.
   */
  @Public()
  @Post('momo/ipn')
  async momoIpn(@Body() body: any, @Res() res: Response) {
    try {
      const isValid = this.momoService.verifySignature(body);

      if (!isValid) {
        return res.status(200).json({
          resultCode: -1,
          message: 'Invalid signature',
        });
      }

      const {
        orderId,
        amount,
        resultCode,
        transId,
      }: { orderId: string; amount: number; resultCode: number; transId: string } =
        body;

      const payment = await this.paymentService.findByTransactionId(orderId);
      if (!payment) {
        return res.status(200).json({
          resultCode: 1,
          message: 'Order not found',
        });
      }

      if (payment.status !== 'pending') {
        return res.status(200).json({
          resultCode: 2,
          message: 'Order already confirmed',
        });
      }

      if (Math.abs(payment.amount - Number(amount)) > 1) {
        return res.status(200).json({
          resultCode: 4,
          message: 'Invalid amount',
        });
      }

      if (Number(resultCode) === 0) {
        await this.paymentService.handlePaymentSuccess(payment.id, transId);
      } else {
        await this.paymentService.handlePaymentFailed(payment.id);
      }

      return res.status(200).json({
        resultCode: 0,
        message: 'Success',
      });
    } catch (error) {
      console.error('MoMo IPN Error:', error);
      return res.status(200).json({
        resultCode: 99,
        message: 'Unknown error',
      });
    }
  }

  /**
   * ZaloPay callback/IPN – ZaloPay gọi POST JSON với { data, mac }.
   * Đây là nơi verify và cập nhật trạng thái payment.
   */
  @Public()
  @Post('zalopay/callback')
  async zaloPayCallback(@Body() body: any, @Res() res: Response) {
    try {
      const verifyResult = this.zaloPayService.verifyCallback(body);

      if (!verifyResult.isValid || !verifyResult.data) {
        return res.status(200).json({
          returncode: -1,
          returnmessage: 'Invalid signature',
        });
      }

      const data = verifyResult.data;
      const appTransId: string = data.app_trans_id;
      const amount: number = data.amount;
      const zpTransId: number = data.zp_trans_id;

      // app_trans_id có dạng yymmdd_TXN..., ta tách transactionId phía sau '_'
      const parts = appTransId.split('_');
      const transactionId = parts.length > 1 ? parts.slice(1).join('_') : appTransId;

      const payment = await this.paymentService.findByTransactionId(
        transactionId,
      );

      if (!payment) {
        return res.status(200).json({
          returncode: 1,
          returnmessage: 'Order not found',
        });
      }

      if (payment.status !== 'pending') {
        return res.status(200).json({
          returncode: 2,
          returnmessage: 'Order already confirmed',
        });
      }

      if (Math.abs(payment.amount - Number(amount)) > 1) {
        return res.status(200).json({
          returncode: 4,
          returnmessage: 'Invalid amount',
        });
      }

      // ZaloPay callback thành công transaction
      await this.paymentService.handlePaymentSuccess(
        payment.id,
        String(zpTransId),
      );

      return res.status(200).json({
        returncode: 1,
        returnmessage: 'Success',
      });
    } catch (error) {
      console.error('ZaloPay callback error:', error);
      return res.status(200).json({
        returncode: 0,
        returnmessage: 'Unknown error',
      });
    }
  }

  /**
   * Stripe webhook – Stripe gọi POST JSON đến URL này.
   * Ở đây demo dùng body đã parse sẵn (chưa verify chữ ký).
   * Nếu đưa vào production, bạn nên cấu hình raw body và verify webhook signature.
   */
  @Public()
  @Post('stripe/webhook')
  async stripeWebhook(@Body() body: any, @Res() res: Response) {
    try {
      const event = body;

      if (event.type === 'checkout.session.completed') {
        const session: any = event.data?.object;
        const transactionId: string | undefined = session?.metadata?.transactionId;

        if (transactionId) {
          const payment = await this.paymentService.findByTransactionId(
            transactionId,
          );
          if (payment && payment.status === 'pending') {
            await this.paymentService.handlePaymentSuccess(
              payment.id,
              session.id,
            );
          }
        }
      }

      return res.status(200).json({ received: true });
    } catch (error) {
      console.error('Stripe webhook error:', error);
      return res.status(400).json({ error: 'Webhook handler failed' });
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
