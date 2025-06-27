import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Table } from '../entities/table.entity';
import { NotificationsGateway } from '../gateways/notifications.gateway';
import { NotificationData } from '../interfaces/notification.interface';
import { NOTIFICATION_EVENTS, NOTIFICATION_ROOMS, NOTIFICATION_MESSAGES } from '../constants/notification.constants';
import { NotificationStatus, NotificationType, NotificationPriority } from '../enums/notification.enum';
import { PaginatedResponse, PaginationParams } from 'src/dtos/filter.dto';
import { Category } from '../entities/category.entity';

@Injectable()
export class TableService {
  constructor(
    @InjectRepository(Table)
    private tableRepository: Repository<Table>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    private notificationsGateway: NotificationsGateway,
  ) { }

  async findAllWithPagination(params: PaginationParams): Promise<PaginatedResponse<Table>> {
    const { page = 1, size = 10, search = '' } = params;
    const skip = (page - 1) * size;

    const queryBuilder = this.tableRepository.createQueryBuilder('table')
      .leftJoinAndSelect('table.tableStatus', 'tableStatus')
      .leftJoinAndSelect('table.tableType', 'tableType')
      .leftJoinAndSelect('table.tableArea', 'tableArea');

    if (search) {
      queryBuilder.where('table.name LIKE :search OR table.description LIKE :search', {
        search: `%${search}%`,
      });
    }

    const [data, total] = await queryBuilder
      .skip(skip)
      .take(size)
      .orderBy('table.createdAt', 'DESC')
      .getManyAndCount();

    return {
      data,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  findAll(): Promise<Table[]> {
    return this.tableRepository.find(
      {
        relations: ['tableStatus', 'tableType', 'tableArea'],
        order: {
          id: 'DESC'
        }
      }
    );
  }

  async create(table: Table): Promise<Table> {
    if (table.tableTypeId) {
      const tableType = await this.categoryRepository.findOne({ where: { id: table.tableTypeId } });
      if (!tableType) {
        throw new NotFoundException(`Table type with ID ${table.tableTypeId} not found`);
      }
    }

    if (table.tableStatusId) {
      const tableStatus = await this.categoryRepository.findOne({ where: { id: table.tableStatusId } });
      if (!tableStatus) {
        throw new NotFoundException(`Table status with ID ${table.tableStatusId} not found`);
      }
    }

    if (table.areaId) {
      const tableArea = await this.categoryRepository.findOne({ where: { id: table.areaId } });
      if (!tableArea) {
        throw new NotFoundException(`Table area with ID ${table.areaId} not found`);
      }
    }

    const newTable = await this.tableRepository.save(table);
    const notificationData: NotificationData = {
      event: NOTIFICATION_EVENTS.NEW_ORDER,
      room: NOTIFICATION_ROOMS.MANAGER_ROOM,
      message: NOTIFICATION_MESSAGES.NEW_ORDER,
      timestamp: new Date(),
      orderId: newTable.id.toString(),
      userId: 'system',
      userName: 'System',
      tableStatus:'',
      status: NotificationStatus.PENDING,
      type: NotificationType.ORDER,
      priority: NotificationPriority.MEDIUM,
      additionalData: newTable
    };
    this.notificationsGateway.notifyAll('tableCreated', notificationData);
    return newTable;
  }

  async update(id: number, table: Table): Promise<Table | null> {
    const existingTable = await this.tableRepository.findOne({ where: { id } });
    if (!existingTable) {
      throw new NotFoundException(`Table with ID ${id} not found`);
    }

    if (table.tableTypeId) {
      const tableType = await this.categoryRepository.findOne({ where: { id: table.tableTypeId } });
      if (!tableType) {
        throw new NotFoundException(`Table type with ID ${table.tableTypeId} not found`);
      }
    }

    if (table.tableStatusId) {
      const tableStatus = await this.categoryRepository.findOne({ where: { id: table.tableStatusId } });
      if (!tableStatus) {
        throw new NotFoundException(`Table status with ID ${table.tableStatusId} not found`);
      }
    }

    if (table.areaId) {
      const tableArea = await this.categoryRepository.findOne({ where: { id: table.areaId } });
      if (!tableArea) {
        throw new NotFoundException(`Table area with ID ${table.areaId} not found`);
      }
    }

    await this.tableRepository.update(id, table);
    const updatedTable = await this.tableRepository.findOne({ 
      where: { id },
      relations: ['tableStatus', 'tableType', 'tableArea']
    });
    
    if (updatedTable) {
      const notificationData: NotificationData = {
        event: NOTIFICATION_EVENTS.NEW_ORDER,
        room: NOTIFICATION_ROOMS.MANAGER_ROOM,
        message: NOTIFICATION_MESSAGES.NEW_ORDER,
        timestamp: new Date(),
        orderId: updatedTable.id.toString(),
        userId: 'system',
        userName: 'System',
        tableStatus:'',
        status: NotificationStatus.PENDING,
        type: NotificationType.ORDER,
        priority: NotificationPriority.MEDIUM,
        additionalData: updatedTable
      };
      this.notificationsGateway.notifyAll('SOCKET_ON', notificationData);
    }
    return updatedTable;
  }

  async updateStatus(id: number, status: string): Promise<Table | null> {
    await this.tableRepository.update(id, { tableStatusId: status });
    const updatedTable = await this.tableRepository.findOne({ where: { id } });
    if (updatedTable) {
      return updatedTable;
    }
    return null;
  }

  async remove(id: number): Promise<void> {
    await this.tableRepository.delete(id);
    const notificationData: NotificationData = {
      event: NOTIFICATION_EVENTS.NEW_ORDER,
      room: NOTIFICATION_ROOMS.MANAGER_ROOM,
      message: NOTIFICATION_MESSAGES.NEW_ORDER,
      timestamp: new Date(),
      orderId: id.toString(),
      userId: 'system',
      userName: 'System',
      tableStatus:'',
      status: NotificationStatus.PENDING,
      type: NotificationType.ORDER,
      priority: NotificationPriority.MEDIUM,
      additionalData: { id }
    };
    this.notificationsGateway.notifyAll('tableDeleted', notificationData);
  }

  findOne(id: number): Promise<Table | null> {
    return this.tableRepository.findOne({
      where: { id },
      relations: ['tableStatus', 'tableType', 'tableArea']
    });
  }
} 