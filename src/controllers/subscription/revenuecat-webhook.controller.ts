import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { RevenueCatWebhookService } from '../../services/revenuecat-webhook.service';

@Controller('revenuecat')
export class RevenueCatWebhookController {
  constructor(private readonly revenueCatWebhookService: RevenueCatWebhookService) {}

  @Post('/webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() body: any) {
    // RevenueCat expects a 200 response quickly
    // Note: It's good practice to verify the Authorization header if configured in RevenueCat dashboard.
    await this.revenueCatWebhookService.handleWebhook(body);
    return { success: true };
  }
}
