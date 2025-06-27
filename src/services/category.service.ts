import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Category } from '../entities/category.entity';
import { PaginatedResponse, PaginationParams } from 'src/dtos/filter.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async findAll(): Promise<Category[]> {
    return this.categoryRepository.find({
      relations: ['type']
    });
  }

  async findOne(id: string): Promise<Category | null> {
    return this.categoryRepository.findOne({ 
      where: { id },
      relations: ['type']
    });
  }

  async findByCode(code: string): Promise<Category | null> {
    const category = this.categoryRepository.findOne({ 
      where: { code }
    });
    return category;
  }

  async create(category: Partial<Category>): Promise<Category | null> {
    const newCategory = this.categoryRepository.create(category);
    return this.categoryRepository.save(newCategory);
  }

  async update(id: string, category: Partial<Category>): Promise<Category | null> {
    await this.categoryRepository.update(id, category);
    return this.categoryRepository.findOne({ 
      where: { id },
      relations: ['type']
    });
  }

  async remove(id: string): Promise<void> {
    await this.categoryRepository.delete(id);
  }

  async findAllWithPagination(params: PaginationParams): Promise<PaginatedResponse<Category>> {
    const { page = 1, size = 10, search = '' } = params;
    const skip = (page - 1) * size;

    const queryBuilder = this.categoryRepository.createQueryBuilder('category')
      .leftJoinAndSelect('category.type', 'type');

    if (search) {
      queryBuilder.where('category.name LIKE :search OR category.code LIKE :search', {
        search: `%${search}%`,
      });
    }

    const [data, total] = await queryBuilder
      .skip(skip)
      .take(size)
      .orderBy('category.createdAt', 'DESC')
      .getManyAndCount();

    return {
      data,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }
} 