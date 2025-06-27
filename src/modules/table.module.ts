import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TableController } from '../controllers/table.controller';
import { TableService } from '../services/table.service';
import { Table } from '../entities/table.entity';
import { Category } from '../entities/category.entity';
import { NotificationsGateway } from '../gateways/notifications.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Table, Category])],
  controllers: [TableController],
  providers: [TableService, NotificationsGateway],
  exports: [TableService],
})
export class TableModule {} 