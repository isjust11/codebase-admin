import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike } from 'typeorm';
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
    const { page, size, search } = filter;
    const [items, total] = await this.notificationRepo.findAndCount({
      where: this.buildSearchWhere(search || '', userId),
      order: { createdAt: 'DESC' },
      skip: (page || 1 - 1) * (size || 10),
      take: (size || 10),
    });
    return { items, total, page, size, totalPages: Math.ceil(total / (size || 10)) };
  }

  async readAll(userId: number) {
    await this.notificationRepo.update({ userId: userId }, { status: NotificationStatus.READ });
    return { message: 'All notifications marked as read' };
  }

  private buildSearchWhere(search: string, userId: number): 
  FindOptionsWhere<Notification> | FindOptionsWhere<Notification>[] {
    if (!search) return { userId: userId };
    return [
      { title: ILike(search) },
      { content: ILike(search) },
      { userId: userId },
    ];
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


