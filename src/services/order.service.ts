import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { FoodItem } from '../entities/food-item.entity';
import { CreateOrderDto, UpdateOrderStatusDto } from '../dtos/order.dto';
import { NotificationPriority } from 'src/enums/notification.enum';
import { NotificationType } from 'src/enums/notification.enum';
import { NOTIFICATION_MESSAGES, NOTIFICATION_EVENTS } from 'src/constants/notification.constants';
import { NotificationData } from 'src/interfaces/notification.interface';
import { NOTIFICATION_ROOMS } from 'src/constants/notification.constants';
import { NotificationStatus } from 'src/enums/notification.enum';
import { NotificationsGateway } from 'src/gateways/notifications.gateway';
import { TableService } from './table.service';
import { CategoryService } from './category.service';
import { tableStatus } from 'src/constants/table.constants';
import { Category } from 'src/entities/category.entity';
import { PaginatedResponse, PaginationParams } from 'src/dtos/filter.dto';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(FoodItem)
    private foodItemRepository: Repository<FoodItem>,
    private tableService: TableService,
    private categoryService:CategoryService,
    private notificationsGateway: NotificationsGateway,
  ) {}

  async create(tableId: number,createOrderDto: CreateOrderDto): Promise<Order> {
    const order = this.orderRepository.create({
      tableId: tableId,
      note: createOrderDto.note,
      userId: createOrderDto.userId,
      statusId: createOrderDto.statusId,
      totalAmount: createOrderDto.totalAmount,
    });

    const savedOrder = await this.orderRepository.save(order);
    // lấy trạng thái sử dụng của bàn
    const category = await this.categoryService.findByCode(tableStatus.USING)
    // if(category == null){
    //   const categoryUsing: Category ={
    //     name:'Đang sử dụng',
    //     code:tableStatus.USING,
    //     description:'',

    //   } 
    //   this.categoryService.create(categoryUsing);
    // }
    // cập nhật trạng thái bàn
    const table = await this.tableService.updateStatus(tableId, category?.id ?? createOrderDto.statusId);
    // 
    console.log('update trạng thái bàn thành công')
    let totalAmount = 0;

    for (const item of createOrderDto.orderItems) {
      const foodItem = await this.foodItemRepository.findOne({
        where: { id: item.foodItemId },
      });

      if (!foodItem) {
        throw new NotFoundException(`Food item with ID ${item.foodItemId} not found`);
      }

      const orderItem = this.orderItemRepository.create({
        order: savedOrder,
        foodItem,
        quantity: item.quantity,
        price: foodItem.price,
        totalPrice: foodItem.price * item.quantity,
        note: item.note,
      });

      await this.orderItemRepository.save(orderItem);
      totalAmount += foodItem.price * item.quantity;
    }

    savedOrder.totalAmount = totalAmount;
    const result = await this.orderRepository.save(savedOrder);
    const notificationData: NotificationData = {
      event: NOTIFICATION_EVENTS.NEW_ORDER,
      room: NOTIFICATION_ROOMS.MANAGER_ROOM,
      message: NOTIFICATION_MESSAGES.NEW_ORDER,
      timestamp: new Date(),
      orderId: savedOrder.id.toString(),
      userId: 'system',
      userName: 'System',
      tableStatus: table?.tableStatusId ??'',
      status: NotificationStatus.PENDING,
      type: NotificationType.ORDER,
      priority: NotificationPriority.MEDIUM,
      additionalData: savedOrder
    };
    this.notificationsGateway.notifyAll(NOTIFICATION_EVENTS.NEW_ORDER, notificationData);
    return result;
  }

  findAll(): Promise<Order[]> {
    return this.orderRepository.find({
      relations: ['orderItems', 'orderItems.foodItem','table', 'account', 'orderStatus'],
    });
  }

  async findOne(id: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['orderItems', 'orderItems.foodItem'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }
  async updateStatus(id: number, updateOrderStatusDto: string): Promise<Order> {
    await this.orderRepository.update(id, { statusId: updateOrderStatusDto });
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.orderRepository.delete(id);
  }

  async findAllWithPagination(params: PaginationParams): Promise<PaginatedResponse<Order>> {
    const { page = 1, size = 10, search = '' } = params;
    const skip = (page - 1) * size;

    const queryBuilder = this.orderRepository.createQueryBuilder('order')
      .leftJoinAndSelect('order.orderItems', 'orderItems')
      .leftJoinAndSelect('orderItems.foodItem', 'foodItem')
      .leftJoinAndSelect('order.table', 'table')
      .leftJoinAndSelect('order.orderStatus', 'orderStatus');

    if (search) {
      queryBuilder.where('order.code LIKE :search OR table.name LIKE :search', {
        search: `%${search}%`,
      });
    }

    const [data, total] = await queryBuilder
      .skip(skip)
      .take(size)
      .orderBy('order.createdAt', 'DESC')
      .getManyAndCount();

    return {
      data,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }
} 