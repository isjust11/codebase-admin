import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { getMessages, SupportedLocale } from 'src/constants/messages';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository, IsNull } from 'typeorm';
import { NotificationConfig } from '../entities/notification-config.entity';

@Injectable()
export class NotificationConfigService {
  constructor(
    @InjectRepository(NotificationConfig)
    private readonly configRepo: Repository<NotificationConfig>,
  ) {}

  async findPagination(page = 1, size = 10, search = '', userId?: number) {
    const whereConditions: any = [];
    
    if (search) {
      if (userId !== undefined) {
        whereConditions.push({ key: Like(`%${search}%`), userId });
      } else {
        whereConditions.push({ key: Like(`%${search}%`) });
      }
    } else {
      if (userId !== undefined) {
        whereConditions.push({ userId });
      }
    }

    const [data, total] = await this.configRepo.findAndCount({
      where: whereConditions.length > 0 ? whereConditions : {},
      order: { createdAt: 'DESC' },
      skip: (page - 1) * size,
      take: size,
    });
    return { data, total, page, size };
  }

  create(data: Partial<NotificationConfig>) {
    const entity = this.configRepo.create(data);
    return this.configRepo.save(entity);
  }

  findOne(id: number) {
    return this.configRepo.findOne({ where: { id } });
  }

  /**
   * Find config by key and userId
   * If userId is null, it returns global config
   */
  async findByKeyAndUser(key: string, userId?: number) {
    return this.configRepo.findOne({ 
      where: { 
        key, 
        userId: userId || IsNull(),
        isActive: true 
      } 
    });
  }

  /**
   * Get config value with user override support
   * Priority: User config > Global config > Default value
   */
  async getConfigValue(key: string, userId?: number, defaultValue?: any) {
    // Try to get user-specific config first
    if (userId) {
      const userConfig = await this.configRepo.findOne({
        where: { key, userId, isActive: true }
      });
      if (userConfig) {
        return userConfig.jsonValue !== null ? userConfig.jsonValue : userConfig.value;
      }
    }

    // Fall back to global config (userId = null)
    const globalConfig = await this.configRepo.findOne({
      where: { key, userId: IsNull(), isActive: true }
    });
    
    if (globalConfig) {
      return globalConfig.jsonValue !== null ? globalConfig.jsonValue : globalConfig.value;
    }

    return defaultValue;
  }

  async update(id: number, data: Partial<NotificationConfig>, locale: SupportedLocale = 'vi') {
    const existing = await this.findOne(id);
    if (!existing) throw new NotFoundException(getMessages(locale).notification.configNotFound);
    Object.assign(existing, data);
    return this.configRepo.save(existing);
  }

  async remove(id: number, locale: SupportedLocale = 'vi') {
    const existing = await this.findOne(id);
    if (!existing) throw new NotFoundException(getMessages(locale).notification.configNotFound);
    existing.isActive = false;
    if(existing.isDefault){
      throw new BadRequestException(getMessages(locale).notification.defaultConfigCannotDelete);
    }
    await this.configRepo.delete(id);
  }
}



