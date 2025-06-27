import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, Query } from '@nestjs/common';
import { OrderService } from '../services/order.service';
import { CreateOrderDto, UpdateOrderStatusDto } from '../dtos/order.dto';
import { EncryptionUtil } from 'src/utils/encryption.util';
import { Base64EncryptionUtil } from 'src/utils/base64Encryption.util';
import { EncryptionInterceptor } from 'src/interceptors/encryption.interceptor';
import { PaginationParams } from 'src/dtos/filter.dto';

@Controller('orders')
@UseInterceptors(EncryptionInterceptor)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post(':id')
  create(@Param('id') id: string, @Body() createOrderDto: CreateOrderDto) {
    // Decrypt the tableId before using it
    const decryptedTableId = Base64EncryptionUtil.decrypt(id);
    return this.orderService.create(Number(decryptedTableId),createOrderDto);
  }

  @Get()
  async getAll(@Query('page') page: number, @Query('size') size: number, @Query('search') search: string) {
    const filter: PaginationParams = {
      page: page || 1,
      size: size || 10,
      search: search || ''
    };
    return this.orderService.findAllWithPagination(filter);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    const decryptedTableId = Base64EncryptionUtil.decrypt(id);
    return this.orderService.findOne(+decryptedTableId);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() updateOrderStatusDto: string) {
    return this.orderService.updateStatus(+id, updateOrderStatusDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.orderService.remove(+id);
  }
} 