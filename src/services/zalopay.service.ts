import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import * as moment from 'moment';
import axios from 'axios';

export interface ZaloPayConfig {
  appId: number;
  key1: string;
  key2: string;
  endpoint: string;
  callbackUrl: string;
}

export interface CreateZaloPayPaymentDto {
  amount: number;
  orderId: string;
  description: string;
  userId: string | number;
}

@Injectable()
export class ZaloPayService {
  private config: ZaloPayConfig;

  constructor() {
    this.config = {
      appId: Number(process.env.ZALOPAY_APP_ID || 0),
      key1: (process.env.ZALOPAY_KEY1 || '').trim(),
      key2: (process.env.ZALOPAY_KEY2 || '').trim(),
      endpoint:
        (process.env.ZALOPAY_ENDPOINT ||
          'https://sandbox.zalopay.com.vn/v001/tpe/createorder').trim(),
      callbackUrl:
        (process.env.ZALOPAY_CALLBACK_URL ||
          'http://localhost:4000/payment/zalopay/callback').trim(),
    };
  }

  /**
   * Tạo order ZaloPay, trả về URL thanh toán
   * Chuẩn theo docs ZaloPay (sandbox).
   */
  async createPaymentUrl(params: CreateZaloPayPaymentDto): Promise<string> {
    const apptransid = this.buildAppTransId(params.orderId);
    const apptime = Date.now();

    const embeddata = JSON.stringify({
      redirecturl: this.config.callbackUrl,
    });

    const item = JSON.stringify([]);

    const order = {
      appid: this.config.appId,
      appuser: String(params.userId),
      apptime,
      amount: params.amount,
      apptransid,
      embeddata,
      item,
      description: params.description,
      bankcode: '',
      callbackurl: this.config.callbackUrl,
    };

    const data =
      this.config.appId +
      '|' +
      order.apptransid +
      '|' +
      order.appuser +
      '|' +
      order.amount +
      '|' +
      order.apptime +
      '|' +
      order.embeddata +
      '|' +
      order.item;

    const mac = crypto
      .createHmac('sha256', this.config.key1)
      .update(data)
      .digest('hex');

    const payload = { ...order, mac };

    const response = await axios.post(this.config.endpoint, null, {
      params: payload,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 30000,
    });

    if (!response.data || response.data.returncode !== 1) {
      throw new Error(
        response.data?.returnmessage || 'ZaloPay create order failed',
      );
    }

    // API trả về orderurl cho web/app mở thanh toán
    return response.data.orderurl;
  }

  /**
   * Verify callback từ ZaloPay (server-to-server).
   * body: { data, mac }
   */
  verifyCallback(body: any): {
    isValid: boolean;
    data?: any;
  } {
    const dataStr = body.data;
    const mac = body.mac;

    const expectedMac = crypto
      .createHmac('sha256', this.config.key2)
      .update(dataStr)
      .digest('hex');

    if (expectedMac !== mac) {
      return { isValid: false };
    }

    const data = JSON.parse(dataStr);
    return { isValid: true, data };
  }

  /**
   * ZaloPay yêu cầu định dạng apptransid: yymmdd_xxx
   * Ta encode transactionId của mình vào phần xxx.
   */
  private buildAppTransId(orderId: string): string {
    const datePrefix = moment().format('YYMMDD');
    return `${datePrefix}_${orderId}`;
  }
}

