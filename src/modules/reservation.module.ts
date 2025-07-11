import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservationController } from '../controllers/reservation.controller';
import { ReservationService } from '../services/reservation.service';
import { Reservation } from '../entities/reservation.entity';
import { Table } from '../entities/table.entity';
import { User } from '../entities/user.entity';
import { RoleService } from '../services/role.service';
import { Role } from '../entities/role.entity';
import { Feature } from '../entities/feature.entity';
import { Permission } from '../entities/permission.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reservation, Table, User, Role, Feature, Permission]),
  ],
  controllers: [ReservationController],
  providers: [ReservationService, RoleService],
  exports: [ReservationService],
})
export class ReservationModule {} 