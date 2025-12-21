import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { CategoryType } from '../entities/category-type.entity';
import { PaginatedResponse, PaginationParams } from 'src/dtos/filter.dto';
import { CategoryTypeEnum } from 'src/enums/category-type.enum';

@Injectable()
export class CategoryTypeService {
  constructor(
    @InjectRepository(CategoryType)
    private categoryTypeRepository: Repository<CategoryType>,
  ) {}

  async findAll(): Promise<CategoryType[]> {
    return this.categoryTypeRepository.find({
      order: {
        createdAt: 'DESC'
      }
    });
  }

  async findOne(id: number): Promise<CategoryType | null> {
    return this.categoryTypeRepository.findOneBy({ id });
  }

  async findByCode(code: string): Promise<CategoryType | null> {
    return this.categoryTypeRepository.findOne({ 
      where: { code },
      relations: ['categories'] // Assuming you want to load related categories as well
    });
  }

  async findByParent(id: number): Promise<CategoryType | null> {
    return this.categoryTypeRepository.findOne({ 
      where: { id },
      relations: ['categories'] // Assuming you want to load related categories as well
    });
  }

  async findArticleType(): Promise<CategoryType[]> {
    return this.categoryTypeRepository.find({
      where: {
        isArticleType: true
      }
    });
  }

  async create(categoryType: CategoryType): Promise<CategoryType> {
    return this.categoryTypeRepository.save(categoryType);
  }

  async update(id: number, categoryType: CategoryType): Promise<CategoryType | null> {
    await this.categoryTypeRepository.update(id, categoryType);
    return this.findOne(id);
  }

  async remove(id: number) {
    return await this.categoryTypeRepository.delete(id);
  }

  async findAllWithPagination(params: PaginationParams): Promise<PaginatedResponse<CategoryType>> {
    const { page = 1, size = 10, search = '' } = params;
    const skip = (page - 1) * size;

    const queryBuilder = this.categoryTypeRepository.createQueryBuilder('categoryType');

    if (search) {
      queryBuilder.where('categoryType.name LIKE :search OR categoryType.code LIKE :search', {
        search: `%${search}%`,
      });
    }

    const [data, total] = await queryBuilder
      .skip(skip)
      .take(size)
      .orderBy('categoryType.createdAt', 'DESC')
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