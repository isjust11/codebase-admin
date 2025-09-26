import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { NotificationConfig } from '../entities/notification-config.entity';

@Injectable()
export class NotificationConfigService {
  constructor(
    @InjectRepository(NotificationConfig)
    private readonly configRepo: Repository<NotificationConfig>,
  ) {}

  async findPagination(page = 1, size = 10, search = '') {
    const [items, total] = await this.configRepo.findAndCount({
      where: search ? [{ key: Like(`%${search}%`) }] : {},
      order: { createdAt: 'DESC' },
      skip: (page - 1) * size,
      take: size,
    });
    return { items, total, page, size };
  }

  create(data: Partial<NotificationConfig>) {
    const entity = this.configRepo.create(data);
    return this.configRepo.save(entity);
  }

  findOne(id: number) {
    return this.configRepo.findOne({ where: { id } });
  }

  async update(id: number, data: Partial<NotificationConfig>) {
    const existing = await this.findOne(id);
    if (!existing) throw new NotFoundException('Config not found');
    Object.assign(existing, data);
    return this.configRepo.save(existing);
  }

  async remove(id: number) {
    await this.configRepo.delete(id);
  }
}



