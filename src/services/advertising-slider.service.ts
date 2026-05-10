import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { getMessages, SupportedLocale } from 'src/constants/messages';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { AdvertisingSlider, SliderType, SliderPosition } from '../entities/advertising-slider.entity';
import { CreateAdvertisingSliderDto, UpdateAdvertisingSliderDto, AdvertisingSliderFilterDto } from '../dtos/advertising-slider.dto';
import { PaginationParams } from '../dtos/filter.dto';

@Injectable()
export class AdvertisingSliderService {
  constructor(
    @InjectRepository(AdvertisingSlider)
    private advertisingSliderRepository: Repository<AdvertisingSlider>,
  ) {}

  async create(createAdvertisingSliderDto: CreateAdvertisingSliderDto): Promise<AdvertisingSlider> {
    const slider = this.advertisingSliderRepository.create({
      ...createAdvertisingSliderDto,
    });

    return await this.advertisingSliderRepository.save(slider);
  }

  async findAllWithPagination(filter: PaginationParams & AdvertisingSliderFilterDto): Promise<{
    data: AdvertisingSlider[];
    total: number;
    page: number;
    size: number;
    totalPages: number;
  }> {
    const { page = 1, size = 10, search, type, position, isActive, isFeatured, createdById } = filter;

    const whereConditions: FindOptionsWhere<AdvertisingSlider> = {};

    if (search) {
      whereConditions.title = Like(`%${search}%`);
    }

    if (type) {
      whereConditions.type = type;
    }

    if (position) {
      whereConditions.position = position;
    }

    if (isActive !== undefined) {
      whereConditions.isActive = isActive;
    }

    if (isFeatured !== undefined) {
      whereConditions.isFeatured = isFeatured;
    }

    if (createdById) {
      whereConditions.createdById = createdById;
    }

    const [data, total] = await this.advertisingSliderRepository.findAndCount({
      where: whereConditions,
      order: { order: 'ASC', createdAt: 'DESC' },
      skip: (page - 1) * size,
      take: size,
    });

    return {
      data,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  async findAll(): Promise<AdvertisingSlider[]> {
    return await this.advertisingSliderRepository.find({
      order: { order: 'ASC', createdAt: 'DESC' },
    });
  }

  async findById(id: number, locale: SupportedLocale = 'vi'): Promise<AdvertisingSlider> {
    const slider = await this.advertisingSliderRepository.findOne({
      where: { id },
      relations: ['createdBy', 'updatedBy'],
    });
 
    if (!slider) {
      throw new NotFoundException(getMessages(locale).advertisingSlider.notFound);
    }
 
    return slider;
  }
 
  async update(id: number, updateAdvertisingSliderDto: UpdateAdvertisingSliderDto, locale: SupportedLocale = 'vi'): Promise<AdvertisingSlider> {
    const slider = await this.findById(id, locale);

    Object.assign(slider, {
      ...updateAdvertisingSliderDto,
    });

    return await this.advertisingSliderRepository.save(slider);
  }

  async remove(id: number, locale: SupportedLocale = 'vi'): Promise<void> {
    const slider = await this.findById(id, locale);
    await this.advertisingSliderRepository.remove(slider);
  }

  // Mobile app specific methods
  async getActiveSliders(): Promise<AdvertisingSlider[]> {
    const now = new Date();
    
    return await this.advertisingSliderRepository.find({
      where: {
        isActive: true,
        startDate: LessThanOrEqual(now),
        endDate: MoreThanOrEqual(now),
      },
      order: { order: 'ASC', createdAt: 'DESC' },
    });
  }

  async getSlidersByPosition(position: SliderPosition): Promise<AdvertisingSlider[]> {
    const now = new Date();
    
    return await this.advertisingSliderRepository.find({
      where: {
        position,
        isActive: true,
        startDate: LessThanOrEqual(now),
        endDate: MoreThanOrEqual(now),
      },
      order: { order: 'ASC', createdAt: 'DESC' },
    });
  }

  async getSlidersByType(type: SliderType): Promise<AdvertisingSlider[]> {
    const now = new Date();
    
    return await this.advertisingSliderRepository.find({
      where: {
        type,
        isActive: true,
        startDate: LessThanOrEqual(now),
        endDate: MoreThanOrEqual(now),
      },
      order: { order: 'ASC', createdAt: 'DESC' },
    });
  }

  async getFeaturedSliders(): Promise<AdvertisingSlider[]> {
    const now = new Date();
    
    return await this.advertisingSliderRepository.find({
      where: {
        isFeatured: true,
        isActive: true,
        startDate: LessThanOrEqual(now),
        endDate: MoreThanOrEqual(now),
      },
      order: { order: 'ASC', createdAt: 'DESC' },
    });
  }

  async incrementViewCount(id: number, locale: SupportedLocale = 'vi'): Promise<AdvertisingSlider> {
    const slider = await this.findById(id, locale);
    slider.viewCount += 1;
    return await this.advertisingSliderRepository.save(slider);
  }

  async incrementClickCount(id: number, locale: SupportedLocale = 'vi'): Promise<AdvertisingSlider> {
    const slider = await this.findById(id, locale);
    slider.clickCount += 1;
    
    // Update CTR (Click-through rate)
    if (slider.viewCount > 0) {
      slider.ctr = (slider.clickCount / slider.viewCount) * 100;
    }
    
    return await this.advertisingSliderRepository.save(slider);
  }

  async toggleActive(id: number, locale: SupportedLocale = 'vi'): Promise<AdvertisingSlider> {
    const slider = await this.findById(id, locale);
    slider.isActive = !slider.isActive;
    return await this.advertisingSliderRepository.save(slider);
  }

  async toggleFeatured(id: number, locale: SupportedLocale = 'vi'): Promise<AdvertisingSlider> {
    const slider = await this.findById(id, locale);
    slider.isFeatured = !slider.isFeatured;
    return await this.advertisingSliderRepository.save(slider);
  }

  async updateOrder(id: number, order: number, locale: SupportedLocale = 'vi'): Promise<AdvertisingSlider> {
    if (order < 1) {
      throw new BadRequestException(getMessages(locale).advertisingSlider.orderInvalid);
    }
 
    const slider = await this.findById(id, locale);
    slider.order = order;
    return await this.advertisingSliderRepository.save(slider);
  }

  async getSliderStats(): Promise<{
    total: number;
    active: number;
    featured: number;
    totalViews: number;
    totalClicks: number;
    averageCTR: number;
  }> {
    const [total, active, featured] = await Promise.all([
      this.advertisingSliderRepository.count(),
      this.advertisingSliderRepository.count({ where: { isActive: true } }),
      this.advertisingSliderRepository.count({ where: { isFeatured: true } }),
    ]);

    const stats = await this.advertisingSliderRepository
      .createQueryBuilder('slider')
      .select([
        'SUM(slider.viewCount) as totalViews',
        'SUM(slider.clickCount) as totalClicks',
        'AVG(slider.ctr) as averageCTR',
      ])
      .getRawOne();

    return {
      total,
      active,
      featured,
      totalViews: parseInt(stats.totalViews) || 0,
      totalClicks: parseInt(stats.totalClicks) || 0,
      averageCTR: parseFloat(stats.averageCTR) || 0,
    };
  }

  async getSlidersByDateRange(startDate: Date, endDate: Date): Promise<AdvertisingSlider[]> {
    return await this.advertisingSliderRepository.find({
      where: {
        startDate: Between(startDate, endDate),
        isActive: true,
      },
      order: { order: 'ASC', createdAt: 'DESC' },
    });
  }
} 