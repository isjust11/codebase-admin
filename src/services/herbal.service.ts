import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Herbal } from '../entities/herbal.entity';
import slugify from 'slugify';
import { PaginatedResponse, PaginationParams } from 'src/dtos/filter.dto';
import { plainToClass } from 'class-transformer';
import { Base64EncryptionUtil } from 'src/utils/base64Encryption.util';
import { CategoryService } from './category.service';
import { ImageEntityType } from 'src/entities/multi-image.entity';
import { MultiImageService } from './multi-image.service';

@Injectable()
export class HerbalService {
  constructor(
    @InjectRepository(Herbal)
    private readonly herbalRepository: Repository<Herbal>,
    private readonly categoryService: CategoryService,
    private readonly multiImageService: MultiImageService
  ) { }

  async findPagination(params: PaginationParams): Promise<PaginatedResponse<Herbal>> {
    const { page = 1, size = 10, search = '' } = params;
    const skip = (page - 1) * size;

    const whereConditions = search ? [
      { title: Like(`%${search}%`) },
      { slug: Like(`%${search}%`) },
      { summary: Like(`%${search}%`) },
      { scientificName: Like(`%${search}%`) },
      { commonNames: Like(`%${search}%`) },
    ] : {};

    const [data, total] = await this.herbalRepository.findAndCount({
      where: whereConditions,
      skip,
      take: size,
      relations: ['category'],
      order: { id: 'DESC' },
    });

    const dataWithImages = await Promise.all(
      data.map(async item => ({
        ...item,
        images: await this.multiImageService.findByEntity(
          ImageEntityType.HERBAL,
          item.id,
        ),
      })),
    );

    return {
      data: dataWithImages,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  async getAll() {
    const data = this.herbalRepository.find();
    return data;
  }

  async create(data: Partial<Herbal>): Promise<Herbal> {
    if (data.title) {
      data.slug = slugify(data.title, { lower: true, strict: true });
    }
    data.id = undefined;
    // Xử lý partsUsedId nếu có
    if (data.partsUsedId != null) {
      const partsUsedId = Base64EncryptionUtil.decrypt(data.partsUsedId.toString());
      data.partsUsedId = partsUsedId;

      const partsUsed = await this.categoryService.findOne(data.partsUsedId);
      data.partsUsedCategory = partsUsed ?? null;
    }

    if (data.categoryId != null) {
      const categoryId = Base64EncryptionUtil.decrypt(data.categoryId.toString());
      data.categoryId = categoryId;

      const category = await this.categoryService.findOne(data.categoryId);
      data.category = category ?? null;
    }


    const herbal = this.herbalRepository.create(data);
    return this.herbalRepository.save(herbal);
  }

  async findAll(): Promise<Herbal[]> {
    const herbals = await this.herbalRepository.find({
      relations: ['category', 'images'],
      order: { id: 'DESC' },
    });
    return plainToClass(Herbal, herbals);
  }

  async findOne(id: number): Promise<Herbal> {
    const herbal = await this.herbalRepository.findOne({
      where: { id },
      relations: ['category'],
    });
    if (!herbal) throw new NotFoundException('Herbal not found');
    return plainToClass(Herbal, herbal);
  }

  async update(id: number, data: Partial<Herbal>): Promise<Herbal> {
    const herbal = await this.findOne(id);
    Object.assign(herbal, {
      ...data,
      id: id,
    });

    if (data.title) {
      data.slug = slugify(data.title, { lower: true, strict: true });
    }

    if (data.partsUsedId != null) {
      const partsUsedId = Base64EncryptionUtil.decrypt(data.partsUsedId.toString());
      herbal.partsUsedId = partsUsedId;

      const partsUsed = await this.categoryService.findOne(herbal.partsUsedId);
      herbal.partsUsedCategory = partsUsed ?? null;
    }

    if (data.categoryId != null) {
      const categoryId = Base64EncryptionUtil.decrypt(data.categoryId.toString());
      herbal.categoryId = categoryId;

      const category = await this.categoryService.findOne(herbal.categoryId);
      herbal.category = category ?? null;
    }

    return this.herbalRepository.save(herbal);
  }

  async remove(id: number): Promise<void> {
    const result = await this.herbalRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Herbal not found');
  }

  async incrementViewCount(id: number): Promise<void> {
    await this.herbalRepository.increment({ id }, 'viewCount', 1);
  }

  async incrementLikeCount(id: number): Promise<void> {
    await this.herbalRepository.increment({ id }, 'likeCount', 1);
  }

  async findByCategory(categoryId: number): Promise<Herbal[]> {
    const herbals = await this.herbalRepository.find({
      where: { categoryId, isActive: true },
      relations: ['category', 'images'],
      order: { id: 'DESC' },
    });
    return plainToClass(Herbal, herbals);
  }

  async findByScientificName(scientificName: string): Promise<Herbal[]> {
    const herbals = await this.herbalRepository.find({
      where: { scientificName: Like(`%${scientificName}%`), isActive: true },
      relations: ['category', 'images'],
      order: { id: 'DESC' },
    });
    return plainToClass(Herbal, herbals);
  }
} 