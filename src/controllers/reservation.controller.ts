import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ReservationService } from '../services/reservation.service';
import { CreateReservationDto, UpdateReservationDto, ConfirmReservationDto } from '../dtos/reservation.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Roles } from '../decorators/roles.decorator';
import { RolesGuard } from 'src/middleware/auth.middleware';
import { RequirePermission } from 'src/decorators/require-permissions.decorator';

// controller quản lý đặt 
@Controller('reservations')
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Post()
  @RequirePermission('CREATE', 'reservation')
  @UseGuards(JwtAuthGuard)
  create(@Body() createReservationDto: CreateReservationDto) {
    return this.reservationService.create(createReservationDto);
  }

  @Get()
  @RequirePermission('READ', 'reservation')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  findAll() {
    return this.reservationService.findAll();
  }

  @Get(':id')
  @RequirePermission('READ', 'reservation')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.reservationService.findOne(+id);
  }

  @Patch(':id')
  @RequirePermission('UPDATE', 'reservation')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateReservationDto: UpdateReservationDto) {
    return this.reservationService.update(+id, updateReservationDto);
  }

  @Post(':id/confirm')
  @RequirePermission('UPDATE', 'reservation')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  confirm(@Param('id') id: string, @Body() confirmReservationDto: ConfirmReservationDto) {
    return this.reservationService.confirm(+id, confirmReservationDto);
  }

  @Post(':id/cancel')
  @RequirePermission('UPDATE', 'reservation')
  @UseGuards(JwtAuthGuard)
  cancel(@Param('id') id: string) {
    return this.reservationService.cancel(+id);
  }

  @Delete(':id')
  @RequirePermission('DELETE', 'reservation')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.reservationService.delete(+id);
  }
} 