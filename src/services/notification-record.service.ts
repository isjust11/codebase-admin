import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike, In } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { PaginationParams } from 'src/dtos/filter.dto';
import { NotificationStatus } from 'src/enums/notification.enum';

@Injectable()
export class NotificationRecordService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) { }

  async findPagination(filter: PaginationParams, userId: number) {
    const { page, size, search, isRead } = filter;
    const [items, total] = await this.notificationRepo.findAndCount({
      where: [
        {
        title: search ? ILike(`%${search}%`) : undefined,
        content: search ? ILike(`%${search}%`) : undefined,
        userId: userId,
        ...(isRead === 2 ? { status: In([NotificationStatus.READ, NotificationStatus.UNREAD]) } : 
         isRead === 1 ? { status: NotificationStatus.READ } : { status: NotificationStatus.UNREAD }),
      } ],
      order: { createdAt: 'DESC' },
      skip: ((page || 1) - 1) * (size || 10),
      take: (size || 10),
    });
    return {
      items,
      total,
      page,
      size,
      totalPages: Math.ceil(total / (size || 10)),
      isRead: isRead || 0,
    };
  }

  async readAll(userId: number) {
    await this.notificationRepo.update({ userId: userId }, { status: NotificationStatus.READ });
    return { message: 'All notifications marked as read' };
  }

  async deleteAll(userId: number) {
    await this.notificationRepo.delete({ userId: userId });
  }

  create(data: Partial<Notification>) {
    const entity = this.notificationRepo.create(data);
    return this.notificationRepo.save(entity);
  }

  findOne(id: number) {
    return this.notificationRepo.findOne({ where: { id } });
  }

  async update(id: number, data: Partial<Notification>) {
    const existing = await this.findOne(id);
    if (!existing) throw new NotFoundException('Notification not found');
    Object.assign(existing, data);
    return this.notificationRepo.save(existing);
  }

  async remove(id: number) {
    await this.notificationRepo.delete(id);
  }
}


