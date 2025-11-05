import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Category } from '../entities/category.entity';
import { CategoryType } from '../entities/category-type.entity';
import { PaginatedResponse, PaginationParams } from 'src/dtos/filter.dto';
import { CategoryTypeEnum } from '../enums/category-type.enum';
import { EncryptionUtil } from 'src/utils/encryption.util';
import { Base64EncryptionUtil } from 'src/utils/base64Encryption.util';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(CategoryType)
    private categoryTypeRepository: Repository<CategoryType>,
  ) {}

  async findAll(): Promise<Category[]> {
    return this.categoryRepository.find({
      relations: ['type']
    });
  }

  async findByCategoryTypeCode(
    categoryTypeCode: string,
    sortBy?: string,
    sortType?: 'ASC' | 'DESC',
  ): Promise<Category[]> {
    const categoryType = await this.categoryTypeRepository.findOne({
      where: { code: categoryTypeCode }
    });

    if (!categoryType) {
      throw new NotFoundException('Category type not found');
    }

    const queryBuilder = this.categoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.type', 'type')
      .where('category.categoryTypeId = :categoryTypeId', { categoryTypeId: categoryType.id });

    const sortDirection: 'ASC' | 'DESC' = (sortType?.toUpperCase() === 'DESC') ? 'DESC' : 'ASC';

    // Allow list to prevent SQL injection on dynamic column names
    const allowedCategoryColumns = new Set([
      'id',
      'code',
      'name',
      'description',
      'isActive',
      'createdAt',
      'updatedAt',
      'order',
    ]);

    let orderColumn = 'category.createdAt';
    if (sortBy) {
      if (sortBy === 'typeCode' || sortBy === 'type.code') {
        orderColumn = 'type.code';
      } else if (allowedCategoryColumns.has(sortBy)) {
        orderColumn = `category.${sortBy}`;
      }
    }

    queryBuilder.orderBy(orderColumn, sortDirection);

    return queryBuilder.getMany();
  }

  async findOne(id: number): Promise<Category | null> {
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
    // Đảm bảo CategoryType tồn tại trước khi tạo Category
      if (category.categoryTypeId && category.categoryTypeId !== 0) {
      await this.ensureCategoryTypeExists(category.categoryTypeId);
    }
    
    const newCategory = this.categoryRepository.create(category);
    return this.categoryRepository.save(newCategory);
  }

  /**
   * Đảm bảo CategoryType tồn tại, nếu không thì tạo mới từ enum
   */
  private async ensureCategoryTypeExists(categoryTypeId: number): Promise<void> {
    const existingCategoryType = await this.categoryTypeRepository.findOne({
      where: { id: categoryTypeId }
    });

    if (!existingCategoryType) {
      // Thử tìm theo code
      const categoryTypeByCode = await this.categoryTypeRepository.findOne({
        where: { id: categoryTypeId }
      });

      if (!categoryTypeByCode) {
        // Kiểm tra xem có phải là enum value không
        const enumValues = Object.values(CategoryTypeEnum);
        if (enumValues.includes(categoryTypeId as unknown as CategoryTypeEnum)) {
          // Tạo mới CategoryType từ enum
          const newCategoryType = this.categoryTypeRepository.create({
            code: categoryTypeId.toString(),
            name: this.formatEnumToName(categoryTypeId.toString()),
            description: `Auto-generated from enum: ${categoryTypeId}`,
            isActive: true,
            iconType: 'lucide',
            createdAt: new Date(),
            updatedAt: new Date()
          });

          await this.categoryTypeRepository.save(newCategoryType);
        }
      }
    }
  }

  /**
   * Format enum value thành tên hiển thị
   */
  private formatEnumToName(enumValue: string): string {
    return enumValue
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .trim();
  }

  async update(id: number, category: Partial<Category>): Promise<Category | null> {
    await this.categoryRepository.update(id, category);
    return this.categoryRepository.findOne({ 
      where: { id },
      relations: ['type']
    });
  }

  async updateStatus(id: number, category: Partial<Category>): Promise<Category | null> {
    await this.categoryRepository.update(id, { isActive: category.isActive });
    return this.categoryRepository.findOne({ where: { id } });
  }

  async remove(id: number): Promise<void> {
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
      .orderBy('type.code', 'ASC')
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