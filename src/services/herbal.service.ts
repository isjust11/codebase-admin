import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Like, Repository } from 'typeorm';
import { Herbal } from '../entities/herbal.entity';
import slugify from 'slugify';
import { PaginatedResponse, PaginationParams } from 'src/dtos/filter.dto';
import { plainToClass } from 'class-transformer';
import { Base64EncryptionUtil } from 'src/utils/base64Encryption.util';
import { CategoryService } from './category.service';
import { ImageEntityType } from 'src/entities/multi-image.entity';
import { MultiImageService } from './multi-image.service';
import { CreateHerbalDto, UpdateHerbalDto } from 'src/dtos/herbal.dto';

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

  async create(data: CreateHerbalDto): Promise<Herbal> {
    const herbalEntity = new Herbal();
    Object.assign(herbalEntity, data);
    if (herbalEntity.title) {
      herbalEntity.slug = slugify(herbalEntity.title, { lower: true, strict: true });
    }
    if (data.categoryId != null) {
      const categoryId = Base64EncryptionUtil.decrypt(data.categoryId.toString());
      herbalEntity.categoryId = categoryId;
      const category = await this.categoryService.findOne(categoryId);
      herbalEntity.category = category ?? null;
    }
    else{
      herbalEntity.categoryId = undefined;
    }

    if (data.dataSourceId != null && data.dataSourceId != '') {
      const dataSourceId = Base64EncryptionUtil.decrypt(data.dataSourceId.toString());
      herbalEntity.dataSourceId = dataSourceId;
    }else{
      herbalEntity.dataSourceId = undefined;
    }
    
    if (data.partsUsedId != null && data.partsUsedId != '') {
      const partsUsedId = Base64EncryptionUtil.decrypt(data.partsUsedId.toString());
      herbalEntity.partsUsedId = partsUsedId;
      const partsUsed = await this.categoryService.findOne(partsUsedId);
      herbalEntity.partsUsedCategory = partsUsed ?? null;
    }else{
      herbalEntity.partsUsedId = undefined;
    }

    const herbal = this.herbalRepository.create(herbalEntity as DeepPartial<Herbal>);
    herbal.createdAt = new Date();
    herbal.id = 0;
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

  async update(id: number, data: UpdateHerbalDto): Promise<Herbal> {
    const herbal = await this.findOne(id);
    Object.assign(herbal, {
      ...data,
      id: id,
    });

    if (data.title) {
      herbal.slug = slugify(data.title, { lower: true, strict: true });
    }

    if (data.partsUsedId != null && data.partsUsedId != '') {
      const partsUsedId = Base64EncryptionUtil.decrypt(data.partsUsedId.toString());
      herbal.partsUsedId = partsUsedId;

      const partsUsed = await this.categoryService.findOne(partsUsedId);
      herbal.partsUsedCategory = partsUsed ?? null;
    }else{
      herbal.partsUsedId = undefined;
    }

    if (data.categoryId != null && data.categoryId != '') {
      const categoryId = Base64EncryptionUtil.decrypt(data.categoryId.toString());
      herbal.categoryId = categoryId;

      const category = await this.categoryService.findOne(categoryId);
      herbal.category = category ?? null;
    }

    if (data.dataSourceId != null && data.dataSourceId != '') {
      const dataSourceId = Base64EncryptionUtil.decrypt(data.dataSourceId.toString());
      herbal.dataSourceId = dataSourceId;
    }else{
      herbal.dataSourceId = undefined;
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