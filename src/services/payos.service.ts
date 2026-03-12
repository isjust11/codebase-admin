import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PayOS } from '@payos/node';

@Injectable()
export class PayosService {
  private payos: PayOS;
  private readonly logger = new Logger(PayosService.name);

  constructor(private configService: ConfigService) {
    this.payos = new PayOS({
      clientId: this.configService.get<string>('PAYOS_CLIENT_ID', ''),
      apiKey: this.configService.get<string>('PAYOS_API_KEY', ''),
      checksumKey: this.configService.get<string>('PAYOS_CHECKSUM_KEY', ''),
    });
  }

  async createPaymentLink(params: {
    orderCode: number;
    amount: number;
    description: string;
    returnUrl: string;
    cancelUrl: string;
  }): Promise<string> {
    try {
      // Chuẩn hóa amount theo constraint của PayOS
      const rawAmount = Number(params.amount);
      const amount = Math.round(rawAmount);

      if (!Number.isFinite(amount) || amount <= 0 || amount > 10000000000) {
        this.logger.error(
          `PayOS amount invalid. orderCode=${params.orderCode}, amount=${params.amount}`,
        );
        throw new BadRequestException(
          'Số tiền không hợp lệ cho PayOS (phải > 0 và <= 10.000.000.000)',
        );
      }

      const desc = params.description.substring(0, 50);
      const body = {
        orderCode: params.orderCode,
        amount,
        description: desc,
        items: [
          {
            name: params.description.substring(0, 127) || 'Thanh toán',
            quantity: 1,
            price: amount,
          },
        ],
        returnUrl: params.returnUrl,
        cancelUrl: params.cancelUrl,
      };

      const paymentLinkRes = await this.payos.paymentRequests.create(body);
      return paymentLinkRes.checkoutUrl;
    } catch (error) {
      this.logger.error('Error creating PayOS payment link:', error);
      throw error;
    }
  }

  async verifyWebhookData(webhookData: any): Promise<any> {
    try {
      const verifyResult = await this.payos.webhooks.verify(webhookData);
      return verifyResult;
    } catch (error) {
      this.logger.error('Error verifying PayOS signature:', error);
      return null;
    }
  }
}
