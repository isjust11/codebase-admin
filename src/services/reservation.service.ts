import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reservation } from '../entities/reservation.entity';
import { CreateReservationDto, UpdateReservationDto, ConfirmReservationDto } from '../dtos/reservation.dto';
import { Table } from '../entities/table.entity';
import { User } from '../entities/user.entity';
import { HistoryService } from './history.service';
import { HistoryAction } from '../entities/history.entity';

@Injectable()
export class ReservationService {
  constructor(
    @InjectRepository(Reservation)
    private reservationRepository: Repository<Reservation>,
    @InjectRepository(Table)
    private tableRepository: Repository<Table>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private historyService: HistoryService,
  ) {}

  async create(createReservationDto: CreateReservationDto): Promise<Reservation> {
    const table = await this.tableRepository.findOne({ where: { id: createReservationDto.tableId } });
    if (!table) {
      throw new NotFoundException('Table not found');
    }

    const user = await this.userRepository.findOne({ where: { id: createReservationDto.userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const reservation = this.reservationRepository.create({
      ...createReservationDto,
      tableReservations: [table],
      account: user,
      statusId: 'PENDING', // Default status
      isConfirmed: false,
    });

    const savedReservation = await this.reservationRepository.save(reservation);
    
    // Ghi lại lịch sử tạo đặt bàn
    await this.historyService.createReservationHistory(
      user.id,
      savedReservation.id,
      HistoryAction.CREATE,
      null,
      savedReservation,
      'Tạo đặt bàn mới'
    );

    return savedReservation;
  }

  async findAll(): Promise<Reservation[]> {
    return this.reservationRepository.find({
      relations: ['tableReservations', 'account', 'reservationStatus'],
    });
  }

  async findOne(id: number): Promise<Reservation> {
    const reservation = await this.reservationRepository.findOne({
      where: { id },
      relations: ['tableReservations', 'account', 'reservationStatus'],
    });
    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }
    return reservation;
  }

  async update(id: number, updateReservationDto: UpdateReservationDto): Promise<Reservation> {
    const oldReservation = await this.findOne(id);
    
    if (updateReservationDto.tableId) {
      const table = await this.tableRepository.findOne({ where: { id: updateReservationDto.tableId } });
      if (!table) {
        throw new NotFoundException('Table not found');
      }
      oldReservation.tableReservations = [table];
    }

    Object.assign(oldReservation, updateReservationDto);
    const updatedReservation = await this.reservationRepository.save(oldReservation);

    // Ghi lại lịch sử cập nhật đặt bàn
    await this.historyService.createReservationHistory(
      oldReservation.account.id,
      updatedReservation.id,
      HistoryAction.UPDATE,
      oldReservation,
      updatedReservation,
      'Cập nhật thông tin đặt bàn'
    );

    return updatedReservation;
  }

  async confirm(id: number, confirmReservationDto: ConfirmReservationDto): Promise<Reservation> {
    const reservation = await this.findOne(id);
    
    const oldStatus = reservation.statusId;
    reservation.isConfirmed = true;
    reservation.confirmedBy = confirmReservationDto.confirmedBy;
    reservation.confirmedTime = Date.now();
    reservation.statusId = 'CONFIRMED';

    const confirmedReservation = await this.reservationRepository.save(reservation);

    // Ghi lại lịch sử xác nhận đặt bàn
    await this.historyService.createReservationHistory(
      confirmReservationDto.confirmedBy,
      confirmedReservation.id,
      HistoryAction.CONFIRM,
      { status: oldStatus },
      { status: 'CONFIRMED' },
      'Xác nhận đặt bàn'
    );

    return confirmedReservation;
  }

  async cancel(id: number): Promise<Reservation> {
    const reservation = await this.findOne(id);
    const oldStatus = reservation.statusId;
    reservation.statusId = 'CANCELLED';
    
    const cancelledReservation = await this.reservationRepository.save(reservation);

    // Ghi lại lịch sử hủy đặt bàn
    await this.historyService.createReservationHistory(
      reservation.account.id,
      cancelledReservation.id,
      HistoryAction.CANCEL,
      { status: oldStatus },
      { status: 'CANCELLED' },
      'Hủy đặt bàn'
    );

    return cancelledReservation;
  }

  async delete(id: number): Promise<void> {
    const reservation = await this.findOne(id);
    const result = await this.reservationRepository.delete(id);
    
    if (result.affected === 0) {
      throw new NotFoundException('Reservation not found');
    }

    // Ghi lại lịch sử xóa đặt bàn
    await this.historyService.createReservationHistory(
      reservation.account.id,
      id,
      HistoryAction.DELETE,
      reservation,
      null,
      'Xóa đặt bàn'
    );
  }
} 