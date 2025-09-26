import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Notification } from '../entities/notification.entity';

@Injectable()
export class NotificationRecordService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  async findPagination(page = 1, size = 10, search = '') {
    const [items, total] = await this.notificationRepo.findAndCount({
      where: this.buildSearchWhere(search),
      order: { createdAt: 'DESC' },
      skip: (page - 1) * size,
      take: size,
    });
    return { items, total, page, size };
  }

  private buildSearchWhere(search: string): FindOptionsWhere<Notification> | FindOptionsWhere<Notification>[] {
    if (!search) return {};
    return [
      { title: search ? (search as any) : undefined },
      { content: search ? (search as any) : undefined },
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


