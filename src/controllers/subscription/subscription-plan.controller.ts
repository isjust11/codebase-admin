import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
  
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PermissionGuard } from '../../guards/permission.guard';
import { RequirePermission } from '../../decorators/require-permissions.decorator';
import { BaseController } from '../base/base.controller';
import { SubscriptionPlanService } from '../../services/subscription-plan.service';
import {
  CreateSubscriptionPlanDto,
  UpdateSubscriptionPlanDto,
} from '../../dtos/subscription-plan.dto';

@Controller('subscription-plans')
export class SubscriptionPlanController extends BaseController {
  constructor(private readonly planService: SubscriptionPlanService) {
    super();
  }

  /** Danh sách gói (cho app: ?activeOnly=true) */
  @Get()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  async list(
    @Query('activeOnly') activeOnly: string,
    @Res() res: Response,
  ) {
    try {
      const onlyActive = activeOnly === 'true' || activeOnly === '1';
      const result = await this.planService.findAll(onlyActive);
      return this.success(res, result);
    } catch (error) {
      this.error(res, error);
    }
  }

  /** Chi tiết một gói */
  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  async getById(@Param('id') id: string, @Res() res: Response) {
    try {
      const numId = this.decode(id);
      if (Number.isNaN(numId)) {
        return this.error(res, { status: 400, message: 'Invalid id' });
      }
      const result = await this.planService.findById(numId);
      return this.success(res, result);
    } catch (error) {
      this.error(res, error);
    }
  }

  /** Admin: tạo gói mới */
  @Post()
  @RequirePermission('CREATE', 'subscription_plan')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  async create(
    @Body() dto: CreateSubscriptionPlanDto,
    @Res() res: Response,
  ) {
    try {
      const result = await this.planService.create(dto);
      return this.success(res, result, 201);
    } catch (error) {
      this.error(res, error);
    }
  }

  /** Admin: cập nhật gói */
  @Put(':id')
  @RequirePermission('UPDATE', 'subscription_plan')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSubscriptionPlanDto,
    @Res() res: Response,
  ) {
    try {
      const numId = this.decode(id);
      if (Number.isNaN(numId)) {
        return this.error(res, { status: 400, message: 'Invalid id' });
      }
      const result = await this.planService.update(numId, dto);
      return this.success(res, result);
    } catch (error) {
      this.error(res, error);
    }
  }

  /** Admin: xóa gói */
  @Delete(':id')
  @RequirePermission('DELETE', 'subscription_plan')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  async remove(@Param('id') id: string, @Res() res: Response) {
    try {
      const numId = this.decode(id);
      if (Number.isNaN(numId)) {
        return this.error(res, { status: 400, message: 'Invalid id' });
      }
      await this.planService.remove(numId);
      return this.success(res, { deleted: true });
    } catch (error) {
      this.error(res, error);
    }
  }
}
