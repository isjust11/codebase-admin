import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import axios from 'axios';

export interface MomoConfig {
  partnerCode: string;
  accessKey: string;
  secretKey: string;
  endpoint: string;
  returnUrl: string;
  ipnUrl: string;
}

export interface CreateMomoPaymentDto {
  amount: number;
  orderId: string;
  orderInfo: string;
  extraData?: string;
}

@Injectable()
export class MomoService {
  private config: MomoConfig;

  constructor() {
    this.config = {
      partnerCode: (process.env.MOMO_PARTNER_CODE || '').trim(),
      accessKey: (process.env.MOMO_ACCESS_KEY || '').trim(),
      secretKey: (process.env.MOMO_SECRET_KEY || '').trim(),
      endpoint:
        (process.env.MOMO_ENDPOINT ||
          'https://test-payment.momo.vn/v2/gateway/api/create').trim(),
      returnUrl:
        (process.env.MOMO_RETURN_URL ||
          'http://localhost:4000/payment/momo/callback').trim(),
      ipnUrl:
        (process.env.MOMO_IPN_URL ||
          'http://localhost:4000/payment/momo/ipn').trim(),
    };
  }

  /**
   * Tạo URL thanh toán MoMo (captureWallet)
   * Tham khảo docs: https://developers.momo.vn/
   */
  async createPaymentUrl(params: CreateMomoPaymentDto): Promise<string> {
    const requestId = `${params.orderId}-${Date.now()}`;
    const requestType = 'captureWallet';
    const extraData = params.extraData || '';

    const rawSignature =
      `accessKey=${this.config.accessKey}` +
      `&amount=${params.amount}` +
      `&extraData=${extraData}` +
      `&ipnUrl=${this.config.ipnUrl}` +
      `&orderId=${params.orderId}` +
      `&orderInfo=${params.orderInfo}` +
      `&partnerCode=${this.config.partnerCode}` +
      `&redirectUrl=${this.config.returnUrl}` +
      `&requestId=${requestId}` +
      `&requestType=${requestType}`;

    const signature = crypto
      .createHmac('sha256', this.config.secretKey)
      .update(rawSignature)
      .digest('hex');

    const payload = {
      partnerCode: this.config.partnerCode,
      partnerName: 'Readbox',
      storeId: 'ReadboxStore',
      requestId,
      amount: params.amount,
      orderId: params.orderId,
      orderInfo: params.orderInfo,
      redirectUrl: this.config.returnUrl,
      ipnUrl: this.config.ipnUrl,
      lang: 'vi',
      extraData,
      requestType,
      signature,
    };

    const response = await axios.post(this.config.endpoint, payload, {
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
      },
      timeout: 30000,
    });

    if (!response.data || response.data.resultCode !== 0) {
      throw new Error(
        response.data?.message || 'MoMo create payment failed',
      );
    }

    // API trả về payUrl (trang thanh toán)
    return response.data.payUrl || response.data.deeplink || '';
  }

  /**
   * Verify chữ ký từ MoMo (IPN / redirect)
   * Lưu ý: thứ tự tham số phải khớp với docs của MoMo.
   */
  verifySignature(data: any): boolean {
    const {
      amount,
      extraData = '',
      ipnUrl,
      orderId,
      orderInfo,
      partnerCode,
      redirectUrl,
      requestId,
      requestType,
      resultCode,
      message,
      orderType,
      transId,
      responseTime,
      payType,
      signature,
      accessKey,
      ...rest
    } = data;

    // MoMo gửi lại accessKey nhưng tốt nhất dùng accessKey cấu hình trên server.
    const usedAccessKey = this.config.accessKey || accessKey;

    const rawSignature =
      `accessKey=${usedAccessKey}` +
      `&amount=${amount}` +
      `&extraData=${extraData}` +
      (ipnUrl ? `&ipnUrl=${ipnUrl}` : '') +
      `&orderId=${orderId}` +
      `&orderInfo=${orderInfo}` +
      (orderType ? `&orderType=${orderType}` : '') +
      `&partnerCode=${partnerCode}` +
      (payType ? `&payType=${payType}` : '') +
      `&requestId=${requestId}` +
      (responseTime ? `&responseTime=${responseTime}` : '') +
      `&resultCode=${resultCode}` +
      (message ? `&message=${message}` : '') +
      (transId ? `&transId=${transId}` : '') +
      (redirectUrl ? `&redirectUrl=${redirectUrl}` : '') +
      (requestType ? `&requestType=${requestType}` : '');

    const expectedSignature = crypto
      .createHmac('sha256', this.config.secretKey)
      .update(rawSignature)
      .digest('hex');

    return expectedSignature === signature;
  }
}

