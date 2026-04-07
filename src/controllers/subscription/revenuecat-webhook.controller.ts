import { Controller, Post, Body, HttpCode, HttpStatus, Headers, UnauthorizedException } from '@nestjs/common';
import { RevenueCatWebhookService } from '../../services/revenuecat-webhook.service';

@Controller('revenuecat')
export class RevenueCatWebhookController {
  constructor(private readonly revenueCatWebhookService: RevenueCatWebhookService) {}

  @Post('/webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() body: any,
    @Headers('authorization') authHeader: string,
  ) {
    // Kiểm tra Authorization header được cấu hình trên RevenueCat Dashboard
    const secret = process.env.REVENUECAT_WEBHOOK_SECRET;
    if (secret && authHeader !== secret) {
      throw new UnauthorizedException('Invalid RevenueCat webhook authorization');
    }

    await this.revenueCatWebhookService.handleWebhook(body);
    return { success: true };
  }
}
