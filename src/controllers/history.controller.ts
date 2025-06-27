import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { HistoryService } from '../services/history.service';
import { GetHistoryDto } from '../dtos/history.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Roles } from '../decorators/roles.decorator';
import { HistoryType } from 'src/entities/history.entity';

@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN', 'STAFF')
  findAll(@Query() query: GetHistoryDto) {
    return this.historyService.findAll(query);
  }

  @Get('reservations')
  @UseGuards(JwtAuthGuard)
  getReservationHistory(@Query() query: GetHistoryDto) {
    return this.historyService.findAll(
      query,
      HistoryType.RESERVATION
    );
  }

  @Get('orders')
  @UseGuards(JwtAuthGuard)
  getOrderHistory(@Query() query: GetHistoryDto) {
    return this.historyService.findAll(query, HistoryType.ORDER
    );
  }

  @Get('payments')
  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN', 'STAFF')
  getPaymentHistory(@Query() query: GetHistoryDto) {
    return this.historyService.findAll(
      query,
      HistoryType.PAYMENT
    );
  }
} 