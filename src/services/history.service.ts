import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { History, HistoryType, HistoryAction } from '../entities/history.entity';
import { CreateHistoryDto, GetHistoryDto } from '../dtos/history.dto';

@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(History)
    private historyRepository: Repository<History>,
  ) {}

  async create(createHistoryDto: CreateHistoryDto): Promise<History> {
    const history = this.historyRepository.create(createHistoryDto);
    return this.historyRepository.save(history);
  }

  async findAll(query: GetHistoryDto, type?: HistoryType): Promise<History[]> {
    const where: any = {};

    if (query.type) {
      where.type = query.type;
    }
    if (query.action) {
      where.action = query.action;
    }
    if (query.userId) {
      where.userId = query.userId;
    }
    if (query.reservationId) {
      where.reservationId = query.reservationId;
    }
    if (query.orderId) {
      where.orderId = query.orderId;
    }

    return this.historyRepository.find({
      where,
      relations: ['user', 'reservation', 'order'],
      order: {
        createdAt: 'DESC'
      }
    });
  }

  async createReservationHistory(
    userId: number,
    reservationId: number,
    action: HistoryAction,
    oldData?: any,
    newData?: any,
    description?: string
  ): Promise<History> {
    return this.create({
      type: HistoryType.RESERVATION,
      action,
      userId,
      reservationId,
      oldData,
      newData,
      description
    });
  }

  async createOrderHistory(
    userId: number,
    orderId: number,
    action: HistoryAction,
    oldData?: any,
    newData?: any,
    description?: string
  ): Promise<History> {
    return this.create({
      type: HistoryType.ORDER,
      action,
      userId,
      orderId,
      oldData,
      newData,
      description
    });
  }

  async createPaymentHistory(
    userId: number,
    orderId: number,
    action: HistoryAction,
    oldData?: any,
    newData?: any,
    description?: string
  ): Promise<History> {
    return this.create({
      type: HistoryType.PAYMENT,
      action,
      userId,
      orderId,
      oldData,
      newData,
      description
    });
  }
} 