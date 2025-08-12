import { Controller, Get, Query, UseGuards, Res, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { BaseController } from '../base/base.controller';
import { RequirePermission } from 'src/decorators/require-permissions.decorator';
import { PermissionGuard } from 'src/guards/permission.guard';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { DashboardService } from 'src/services/dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, PermissionGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class DashboardController extends BaseController {
  constructor(private readonly dashboardService: DashboardService) {
    super();
  }

  @Get('overview')
  @RequirePermission('READ', 'dashboard')
  async getOverview(@Res() res: Response) {
    try {
      const overview = await this.dashboardService.getOverview();
      return this.success(res as any, overview);
    } catch (error) {
      return this.error(res as any, error.message);
    }
  }

  @Get('statistics')
  @RequirePermission('READ', 'dashboard')
  async getStatistics(@Query('period') period: string = '7d', @Res() res: Response) {
    try {
      const statistics = await this.dashboardService.getStatistics(period);
      return this.success(res as any, statistics);
    } catch (error) {
      return this.error(res as any, error.message);
    }
  }

  @Get('recent-activities')
  @RequirePermission('READ', 'dashboard')
  async getRecentActivities(@Query('limit') limit: number = 10, @Res() res: Response) {
    try {
      const activities = await this.dashboardService.getRecentActivities(limit);
      return this.success(res as any, activities);
    } catch (error) {
      return this.error(res as any, error.message);
    }
  }

  @Get('top-performers')
  @RequirePermission('READ', 'dashboard')
  async getTopPerformers(@Query('type') type: string, @Query('limit') limit: number = 5, @Res() res: Response) {
    try {
      const performers = await this.dashboardService.getTopPerformers(type, limit);
      return this.success(res as any, performers);
    } catch (error) {
      return this.error(res as any, error.message);
    }
  }

  @Get('revenue-analytics')
  @RequirePermission('READ', 'dashboard')
  async getRevenueAnalytics(@Query('period') period: string = '30d', @Res() res: Response) {
    try {
      const analytics = await this.dashboardService.getRevenueAnalytics(period);
      return this.success(res as any, analytics);
    } catch (error) {
      return this.error(res as any, error.message);
    }
  }

  @Get('user-growth')
  @RequirePermission('READ', 'dashboard')
  async getUserGrowth(@Query('period') period: string = '12m', @Res() res: Response) {
    try {
      const growth = await this.dashboardService.getUserGrowth(period);
      return this.success(res as any, growth);
    } catch (error) {
      return this.error(res as any, error.message);
    }
  }
}
