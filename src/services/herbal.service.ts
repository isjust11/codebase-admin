import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Herbal } from '../entities/herbal.entity';
import slugify from 'slugify';
import { PaginatedResponse, PaginationParams } from 'src/dtos/filter.dto';
import { plainToClass } from 'class-transformer';
import { Base64EncryptionUtil } from 'src/utils/base64Encryption.util';
import { UserService } from './user.service';
import { CategoryService } from './category.service';

@Injectable()
export class HerbalService {
  constructor(
    @InjectRepository(Herbal)
    private readonly herbalRepository: Repository<Herbal>,
    private readonly categoryService: CategoryService
  ) {}

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
      relations: ['category', 'images'],
      order: { id: 'DESC' },
    });

    return {
      data: plainToClass(Herbal, data),
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  async getAll(){
    const data = this.herbalRepository.find();
    return data;
  }

  async create(data: Partial<Herbal>): Promise<Herbal> {
    if (data.title) {
      data.slug = slugify(data.title, { lower: true, strict: true });
    }
    data.id = undefined;
    // Xử lý authorId nếu có
    if (data.authorId != null) {
      // const authorId = Base64EncryptionUtil.decrypt(data.authorId);
      // data.authorId = parseInt(authorId, 10);

      // const author = await this.userRepository.findOne({
      //   where: { id: data.authorId },
      // });
      // data.author = author ?? null;
    }

    // Xử lý categoryId nếu có
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

    if (data.authorId != null) {
      // const authorId = Base64EncryptionUtil.decrypt(data.authorId);
      // herbal.authorId = parseInt(authorId, 10);

      // const author = await this.userRepository.findOne({
      //   where: { id: herbal.authorId },
      // });
      // herbal.author = author ?? null;
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

  async findByFamily(family: string): Promise<Herbal[]> {
    const herbals = await this.herbalRepository.find({
      where: { family: Like(`%${family}%`), isActive: true },
      relations: ['category', 'images'],
      order: { id: 'DESC' },
    });
    return plainToClass(Herbal, herbals);
  }
} 