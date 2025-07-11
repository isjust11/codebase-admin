import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { HistoryService } from '../services/history.service';
import { GetHistoryDto } from '../dtos/history.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { HistoryType } from 'src/entities/history.entity';
import { BaseController } from './base.controller';
import { RequirePermission } from 'src/decorators/require-permissions.decorator';
import { PermissionGuard } from 'src/guards/permission.guard';

@Controller('history')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class HistoryController extends BaseController{
  constructor(private readonly historyService: HistoryService) {
    super();
  }

  @Get()
  @RequirePermission('READ', 'history')
  findAll(@Query() query: GetHistoryDto) {
    return this.historyService.findAll(query);
  }

  @Get('reservations')
  @RequirePermission('READ', 'history')
  getReservationHistory(@Query() query: GetHistoryDto) {
    return this.historyService.findAll(
      query,
      HistoryType.RESERVATION
    );
  }

  @Get('orders')
  @RequirePermission('READ', 'history')
  getOrderHistory(@Query() query: GetHistoryDto) {
    return this.historyService.findAll(query, HistoryType.ORDER
    );
  }

  @Get('payments')
  @RequirePermission('READ', 'history')
  getPaymentHistory(@Query() query: GetHistoryDto) {
    return this.historyService.findAll(
      query,
      HistoryType.PAYMENT
    );
  }
} 