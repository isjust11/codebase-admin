import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryType } from '../entities/category-type.entity';
import { CategoryTypeEnum } from '../enums/category-type.enum';

@Injectable()
export class CategoryTypeSyncService {
  constructor(
    @InjectRepository(CategoryType)
    private categoryTypeRepository: Repository<CategoryType>,
  ) {}

  /**
   * Đồng bộ tất cả CategoryType từ enum
   */
  async syncFromEnum(): Promise<{ created: number; updated: number; total: number }> {
    const enumValues = Object.values(CategoryTypeEnum);
    let created = 0;
    let updated = 0;

    for (const enumValue of enumValues) {
      const existingCategoryType = await this.categoryTypeRepository.findOne({
        where: { code: enumValue }
      });

      if (!existingCategoryType) {
        // Tạo mới CategoryType
        const newCategoryType = this.categoryTypeRepository.create({
          code: enumValue,
          name: this.formatEnumToName(enumValue),
          description: `Auto-generated from enum: ${enumValue}`,
          isActive: true,
          iconType: 'lucide',
          createdAt: new Date(),
          updatedAt: new Date()
        });

        await this.categoryTypeRepository.save(newCategoryType);
        created++;
      } else {
        // Cập nhật nếu cần
        const needsUpdate = !existingCategoryType.name || 
                           existingCategoryType.name === enumValue ||
                           !existingCategoryType.description;

        if (needsUpdate) {
          await this.categoryTypeRepository.update(existingCategoryType.id, {
            name: this.formatEnumToName(enumValue),
            description: `Auto-generated from enum: ${enumValue}`,
            updatedAt: new Date()
          });
          updated++;
        }
      }
    }

    return {
      created,
      updated,
      total: enumValues.length
    };
  }

  /**
   * Đồng bộ một CategoryType cụ thể từ enum
   */
  async syncSingleFromEnum(enumValue: string): Promise<CategoryType> {
    const existingCategoryType = await this.categoryTypeRepository.findOne({
      where: { code: enumValue }
    });

    if (!existingCategoryType) {
      const newCategoryType = this.categoryTypeRepository.create({
        code: enumValue,
        name: this.formatEnumToName(enumValue),
        description: `Auto-generated from enum: ${enumValue}`,
        isActive: true,
        iconType: 'lucide',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      return await this.categoryTypeRepository.save(newCategoryType);
    }

    return existingCategoryType;
  }

  /**
   * Kiểm tra và tạo CategoryType nếu chưa tồn tại
   */
  async ensureCategoryTypeExists(enumValue: string): Promise<CategoryType> {
    return this.syncSingleFromEnum(enumValue);
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

  /**
   * Lấy danh sách CategoryType chưa được đồng bộ
   */
  async getUnsyncedEnumValues(): Promise<string[]> {
    const existingCodes = await this.categoryTypeRepository
      .createQueryBuilder('ct')
      .select('ct.code')
      .getRawMany();

    const existingCodeSet = new Set(existingCodes.map(item => item.ct_code));
    const enumValues = Object.values(CategoryTypeEnum);

    return enumValues.filter(enumValue => !existingCodeSet.has(enumValue));
  }
} 