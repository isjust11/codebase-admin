import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { NotificationTemplate } from '../entities/notification-template.entity';

@Injectable()
export class NotificationTemplateService {
  constructor(
    @InjectRepository(NotificationTemplate)
    private readonly templateRepo: Repository<NotificationTemplate>,
  ) {}

  async findPagination(page = 1, size = 10, search = '') {
    const [items, total] = await this.templateRepo.findAndCount({
      where: search
        ? [{ name: Like(`%${search}%`) }, { code: Like(`%${search}%`) }]
        : {},
      order: { createdAt: 'DESC' },
      skip: (page - 1) * size,
      take: size,
    });
    return { items, total, page, size };
  }

  create(data: Partial<NotificationTemplate>) {
    const entity = this.templateRepo.create(data);
    return this.templateRepo.save(entity);
  }

  findOne(id: number) {
    return this.templateRepo.findOne({ where: { id } });
  }

  async update(id: number, data: Partial<NotificationTemplate>) {
    const existing = await this.findOne(id);
    if (!existing) throw new NotFoundException('Template not found');
    Object.assign(existing, data);
    return this.templateRepo.save(existing);
  }

  async remove(id: number) {
    await this.templateRepo.delete(id);
  }
}



