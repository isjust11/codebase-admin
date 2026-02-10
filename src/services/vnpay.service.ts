import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import * as moment from 'moment';
import * as qs from 'qs';

export interface VNPayConfig {
  tmnCode: string; // Mã website tại VNPay
  hashSecret: string; // Secret key
  url: string; // URL VNPay
  returnUrl: string; // URL callback từ VNPay về app
  ipnUrl: string; // URL webhook (IPN) từ VNPay về backend
}

export interface CreatePaymentDto {
  amount: number; // Số tiền (VND)
  orderInfo: string; // Mô tả đơn hàng
  orderType: string; // Loại đơn hàng (VD: 'billpayment')
  orderId: string; // Mã đơn hàng unique
  locale?: string; // 'vn' | 'en'
  bankCode?: string; // Mã ngân hàng (optional)
  ipAddress: string; // IP người dùng
}

@Injectable()
export class VNPayService {
  private config: VNPayConfig;

  constructor() {
    // Load từ .env và trim để loại bỏ khoảng trắng thừa
    this.config = {
      tmnCode: (process.env.VNPAY_TMN_CODE || 'DEMO_SANDBOX').trim(),
      hashSecret: (process.env.VNPAY_HASH_SECRET || 'SANDBOX_SECRET').trim(),
      url: (process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html').trim(),
      returnUrl: (process.env.VNPAY_RETURN_URL || 'http://localhost:3000/payment/vnpay/callback').trim(),
      ipnUrl: (process.env.VNPAY_IPN_URL || 'http://localhost:4000/payment/vnpay/ipn').trim(),
    };
  }

  /**
   * Tạo URL thanh toán VNPay
   */
  createPaymentUrl(params: CreatePaymentDto): string {
    const createDate = moment().format('YYYYMMDDHHmmss');
    const expireDate = moment().add(15, 'minutes').format('YYYYMMDDHHmmss');

    // Tạo object params với giá trị raw (KHÔNG encode trước)
    let vnpParams: any = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.config.tmnCode,
      vnp_Locale: params.locale || 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: params.orderId,
      vnp_OrderInfo: params.orderInfo,
      vnp_OrderType: params.orderType,
      vnp_Amount: params.amount * 100, // VNPay yêu cầu nhân 100
      vnp_ReturnUrl: this.config.returnUrl,
      vnp_IpAddr: params.ipAddress,
      vnp_CreateDate: createDate,
      vnp_ExpireDate: expireDate,
    };

    if (params.bankCode) {
      vnpParams.vnp_BankCode = params.bankCode;
    }

    // Sắp xếp params theo alphabet
    vnpParams = this.sortObject(vnpParams);

    // Tạo chuỗi để ký: dùng encode: false
    const signData = qs.stringify(vnpParams, { encode: false });

    // Debug: Log chuỗi ký và hash secret
    console.log('=== VNPAY DEBUG ===');
    console.log('Sign Data:', signData);
    console.log('Hash Secret:', this.config.hashSecret);
    const signDataEncoded = Object.keys(vnpParams)
      .map((key) => `${key}=${encodeURIComponent(vnpParams[key].toString()).replace(/%20/g, '%20')}`)
      .join('&');
    // console.log('Sign Data2:', signDataEncoded);
    // Tạo secure hash
    const hmac = crypto.createHmac('sha512', this.config.hashSecret);
    const signed = hmac.update(Buffer.from(signDataEncoded, 'utf-8')).digest('hex');

    console.log('Signature:', signed);
    console.log('===================');

    // Thêm vnp_SecureHash vào params
    vnpParams['vnp_SecureHash'] = signed;

    // Build URL cuối cùng: dùng encode: true để encode đúng format URL
    const paymentUrl = this.config.url + '?' + qs.stringify(vnpParams, { encode: true });
    return paymentUrl;
  }

  /**
   * Verify callback từ VNPay (IPN hoặc return URL)
   */
  verifyReturnUrl(query: any): {
    isValid: boolean;
    data?: any;
    message?: string;
  } {
    const secureHash = query['vnp_SecureHash'];
    delete query['vnp_SecureHash'];
    delete query['vnp_SecureHashType'];

    // Sắp xếp params
    const sortedQuery = this.sortObject(query);
    const signData = qs.stringify(sortedQuery, { encode: false });

    // Verify hash
    const hmac = crypto.createHmac('sha512', this.config.hashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (secureHash !== signed) {
      return {
        isValid: false,
        message: 'Invalid signature',
      };
    }

    // Kiểm tra response code
    const responseCode = query['vnp_ResponseCode'];
    const isSuccess = responseCode === '00';

    return {
      isValid: true,
      data: {
        orderId: query['vnp_TxnRef'],
        amount: parseInt(query['vnp_Amount']) / 100,
        responseCode,
        isSuccess,
        transactionNo: query['vnp_TransactionNo'],
        bankCode: query['vnp_BankCode'],
        cardType: query['vnp_CardType'],
        payDate: query['vnp_PayDate'],
      },
    };
  }

  /**
   * Sắp xếp object theo key (alphabet)
   */
  private sortObject(obj: any): any {
    const sorted: any = {};
    const keys = Object.keys(obj).sort();
    keys.forEach((key) => {
      sorted[key] = obj[key];
    });
    return sorted;
  }

  /**
   * Lấy thông tin lỗi từ response code
   */
  getErrorMessage(responseCode: string): string {
    const errorMessages: { [key: string]: string } = {
      '00': 'Giao dịch thành công',
      '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
      '09': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.',
      '10': 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
      '11': 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.',
      '12': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.',
      '13': 'Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP).',
      '24': 'Giao dịch không thành công do: Khách hàng hủy giao dịch',
      '51': 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.',
      '65': 'Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.',
      '75': 'Ngân hàng thanh toán đang bảo trì.',
      '79': 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định.',
      '99': 'Các lỗi khác',
    };
    return errorMessages[responseCode] || 'Lỗi không xác định';
  }
}
