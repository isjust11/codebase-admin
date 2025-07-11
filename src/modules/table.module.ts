import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TableController } from '../controllers/table.controller';
import { TableService } from '../services/table.service';
import { Table } from '../entities/table.entity';
import { Category } from '../entities/category.entity';
import { NotificationsGateway } from '../gateways/notifications.gateway';
import { RoleService } from '../services/role.service';
import { Role } from '../entities/role.entity';
import { Feature } from '../entities/feature.entity';
import { Permission } from '../entities/permission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Table, Category, Role, Feature, Permission])],
  controllers: [TableController],
  providers: [TableService, NotificationsGateway, RoleService],
  exports: [TableService],
})
export class TableModule {} 