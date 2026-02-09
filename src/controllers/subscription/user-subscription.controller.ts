import {
  Controller,
  Get,
  Post,
  Body,
  Res,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PermissionGuard } from '../../guards/permission.guard';
import { BaseController } from '../base/base.controller';
import { UserSubscriptionService } from '../../services/user-subscription.service';
import {
  CreateUserSubscriptionDto,
  IncrementUsageDto,
} from '../../dtos/user-subscription.dto';

@Controller('subscription')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class UserSubscriptionController extends BaseController {
  constructor(private readonly subscriptionService: UserSubscriptionService) {
    super();
  }

  /** Gói đăng ký hiện tại của user + usage */
  @Get('me')
  async getMySubscription(@Request() req: any, @Res() res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return this.error(res, { status: 401, message: 'Unauthorized' });
      }
      const sub = await this.subscriptionService.getActiveSubscription(userId);
      if (!sub) {
        return this.success(res, { subscription: null, usage: null });
      }
      const plan = sub.plan;
      const usage = {
        storageUsedBytes: String(sub.storageUsedBytes ?? '0'),
        storageLimitBytes: plan?.storageLimitBytes ?? '0',
        ttsUsedInPeriod: sub.ttsUsedInPeriod ?? 0,
        ttsLimitPerPeriod: plan?.ttsLimitPerPeriod ?? 0,
        convertUsedInPeriod: sub.convertUsedInPeriod ?? 0,
        convertLimitPerPeriod: plan?.convertLimitPerPeriod ?? 0,
        currentPeriodKey: sub.currentPeriodKey,
      };
      return this.success(res, {
        subscription: sub,
        usage,
      });
    } catch (error) {
      this.error(res, error);
    }
  }

  /** Lịch sử đăng ký của user */
  @Get('me/history')
  async getMyHistory(@Request() req: any, @Res() res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return this.error(res, { status: 401, message: 'Unauthorized' });
      }
      const list = await this.subscriptionService.getByUserId(userId);
      return this.success(res, list);
    } catch (error) {
      this.error(res, error);
    }
  }

  /** Đăng ký gói mới (tạo bản ghi pending_payment hoặc trial) */
  @Post('me')
  async subscribe(
    @Request() req: any,
    @Body() dto: CreateUserSubscriptionDto,
    @Res() res: Response,
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return this.error(res, { status: 401, message: 'Unauthorized' });
      }
      const result = await this.subscriptionService.create(userId, dto);
      return this.success(res, result, 201);
    } catch (error) {
      this.error(res, error);
    }
  }

  /** Kiểm tra quota (TTS / convert / storage) - dùng cho app trước khi gọi TTS/convert */
  @Get('me/usage/check')
  async checkUsage(
    @Request() req: any,
    @Res() res: Response,
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return this.error(res, { status: 401, message: 'Unauthorized' });
      }
      const [canTts, canConvert] = await Promise.all([
        this.subscriptionService.canUseTts(userId),
        this.subscriptionService.canUseConvert(userId),
      ]);
      return this.success(res, {
        canUseTts: canTts,
        canUseConvert: canConvert,
      });
    } catch (error) {
      this.error(res, error);
    }
  }

  /** Tăng usage (có thể gọi nội bộ từ converter/TTS service; hoặc từ app sau mỗi lần dùng) */
  @Post('me/usage')
  async incrementUsage(
    @Request() req: any,
    @Body() dto: IncrementUsageDto,
    @Res() res: Response,
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return this.error(res, { status: 401, message: 'Unauthorized' });
      }
      const result = await this.subscriptionService.incrementUsage(userId, dto);
      return this.success(res, result ?? { message: 'No active subscription' });
    } catch (error) {
      this.error(res, error);
    }
  }
}
