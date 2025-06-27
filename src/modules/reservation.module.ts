import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservationController } from '../controllers/reservation.controller';
import { ReservationService } from '../services/reservation.service';
import { Reservation } from '../entities/reservation.entity';
import { Table } from '../entities/table.entity';
import { User } from '../entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reservation, Table, User]),
  ],
  controllers: [ReservationController],
  providers: [ReservationService],
  exports: [ReservationService],
})
export class ReservationModule {} 