import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HistoryController } from '../controllers/history.controller';
import { HistoryService } from '../services/history.service';
import { History } from '../entities/history.entity';
import { Reservation } from '../entities/reservation.entity';
import { Order } from '../entities/order.entity';
import { User } from '../entities/user.entity';
import { RoleService } from '../services/role.service';
import { Role } from '../entities/role.entity';
import { Feature } from '../entities/feature.entity';
import { Permission } from '../entities/permission.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([History, Reservation, Order, User, Role,Feature, Permission]),
  ],
  controllers: [HistoryController],
  providers: [HistoryService, RoleService],
  exports: [HistoryService],
})
export class HistoryModule {} 