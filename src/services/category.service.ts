import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { getMessages, SupportedLocale } from 'src/constants/messages';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { CategoryType } from '../entities/category-type.entity';
import { PaginatedResponse, PaginationParams } from 'src/dtos/filter.dto';
import { CategoryTypeEnum } from 'src/enums/category-type.enum';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(CategoryType)
    private categoryTypeRepository: Repository<CategoryType>,
  ) { }

  async findAll(): Promise<Category[]> {
    return this.categoryRepository.find({
      relations: ['type', 'parent']
    });
  }

  async findByCategoryTypeCode(
    categoryTypeCode: string,
    sortBy?: string,
    sortType?: 'ASC' | 'DESC',
    locale: SupportedLocale = 'vi'
  ): Promise<Category[]> {
    const categoryType = await this.categoryTypeRepository.findOne({
      where: { code: categoryTypeCode }
    });

    if (!categoryType) {
      throw new NotFoundException(getMessages(locale).category.typeNotFound);
    }

    const queryBuilder = this.categoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.type', 'type')
      .leftJoinAndSelect('category.parent', 'parent')
      .where('category.categoryTypeId = :categoryTypeId', { categoryTypeId: categoryType.id });

    const sortDirection: 'ASC' | 'DESC' = (sortType?.toUpperCase() === 'DESC') ? 'DESC' : 'ASC';

    // Allow list to prevent SQL injection on dynamic column names
    const allowedCategoryColumns = new Set([
      'id',
      'code',
      'name',
      'description',
      'nameEN',
      'descriptionEN',
      'parentId',
      'isActive',
      'sortOrder',
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

  async findTreeByCategoryTypeCode(
    categoryTypeCode: string,
    sortBy?: string,
    sortType?: 'ASC' | 'DESC',
    locale: SupportedLocale = 'vi'
  ): Promise<Category[]> {
    const categories = await this.findByCategoryTypeCode(
      categoryTypeCode,
      sortBy ?? 'sortOrder',
      sortType ?? 'ASC',
      locale
    );

    return this.buildCategoryTree(categories);
  }

  async findOne(id: number): Promise<Category | null> {
    return this.categoryRepository.findOne({
      where: { id },
      relations: ['type', 'parent', 'children']
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

    await this.validateParentCategory(category.parentId, category.categoryTypeId);

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
    await this.validateParentCategory(category.parentId, category.categoryTypeId, id);
    await this.categoryRepository.update(id, category);
    return this.categoryRepository.findOne({
      where: { id },
      relations: ['type', 'parent', 'children']
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

  /**
   * Lấy id của category gốc + toàn bộ con cháu chắt ở mọi cấp.
   * Dùng cho filter book theo nhánh: vd category "Lập trình" thì
   * cần match cả book thuộc "Web", "JavaScript", "React",...
   */
  async getDescendantIds(rootId: number): Promise<number[]> {
    if (!rootId) return [];

    // Lấy nhẹ chỉ id + parentId của tất cả category để dựng tree trong RAM
    const all = await this.categoryRepository.find({
      select: ['id', 'parentId'],
    });

    const childrenMap = new Map<number, number[]>();
    all.forEach((c) => {
      if (c.parentId == null) return;
      const list = childrenMap.get(c.parentId);
      if (list) {
        list.push(c.id);
      } else {
        childrenMap.set(c.parentId, [c.id]);
      }
    });

    const result: number[] = [];
    const queue: number[] = [rootId];
    const visited = new Set<number>();
    while (queue.length > 0) {
      const cur = queue.shift()!;
      if (visited.has(cur)) continue;
      visited.add(cur);
      result.push(cur);
      const childIds = childrenMap.get(cur);
      if (childIds) queue.push(...childIds);
    }
    return result;
  }

  private buildCategoryTree(categories: Category[]): Category[] {
    const categoryMap = new Map<number, Category>();
    const roots: Category[] = [];

    categories.forEach((category) => {
      category.children = [];
      categoryMap.set(category.id, category);
    });

    categories.forEach((category) => {
      if (category.parentId && categoryMap.has(category.parentId)) {
        categoryMap.get(category.parentId)!.children.push(category);
      } else {
        roots.push(category);
      }
    });

    return roots;
  }

  private async validateParentCategory(
    parentId?: number,
    categoryTypeId?: number,
    categoryId?: number
  ): Promise<void> {
    if (!parentId) return;

    if (categoryId && parentId === categoryId) {
      throw new BadRequestException('Category cannot be its own parent');
    }

    const parent = await this.categoryRepository.findOne({
      where: { id: parentId },
    });

    if (!parent) {
      throw new BadRequestException('Parent category not found');
    }

    if (categoryTypeId && parent.categoryTypeId !== categoryTypeId) {
      throw new BadRequestException('Parent category must have the same category type');
    }
  }
} 