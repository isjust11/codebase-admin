import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { FcmToken } from '../entities/fcm-token.entity';
import { FcmTokenDto } from '../dtos/fcm-token.dto';
@Injectable()
export class FcmTokenService {
  constructor(
    @InjectRepository(FcmToken)
    private readonly fcmRepo: Repository<FcmToken>,
  ) {}

  async findPagination(page = 1, size = 10, search = '') {
    const [items, total] = await this.fcmRepo.findAndCount({
      where: search ? [{ token: Like(`%${search}%`) }, { deviceId: Like(`%${search}%`) }] : {},
      order: { createdAt: 'DESC' },
      skip: (page - 1) * size,
      take: size,
    });
    return { items, total, page, size };
  }

  async registerOrUpdate(data: FcmTokenDto, userId: number) {
    const existing = await this.fcmRepo.findOne({ where: { token: data.token, platform: data.platform } });
    if (existing) {
      existing.deviceId = data.deviceId ?? existing.deviceId ?? '';
      existing.userId = userId;
      existing.updatedAt = new Date();
      return this.fcmRepo.save(existing);
    }
    const entity = this.fcmRepo.create({
      token: data.token,
      platform: data.platform,
      deviceId: data.deviceId ?? '',
      userId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    });
    return this.fcmRepo.save(entity);
  }

  findOne(id: number) {
    return this.fcmRepo.findOne({ where: { id } });
  }

  async deactivate(id: number) {
    await this.fcmRepo.update(id, { isActive: false });
  }

  async remove(id: number) {
    await this.fcmRepo.delete(id);
  }
}



