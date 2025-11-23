import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, In, Like, Repository } from 'typeorm';
import { FolkMedicine } from '../entities/folk-medicine.entity';
import slugify from 'slugify';
import { PaginatedResponse, PaginationParams } from 'src/dtos/filter.dto';
import { plainToClass } from 'class-transformer';
import { Base64EncryptionUtil } from 'src/utils/base64Encryption.util';
import { CategoryService } from './category.service';
import { AuthorService } from './author.service';
import { FolkMedicineDto } from 'src/dtos/folk-medicine.dto';
import { DataSourceService } from './data-source.service';
import { FolkMedicineIngredient } from '../entities/folk-medicine-ingredient.entity';
import { DiseaseService } from './disease.service';
import { Disease } from 'src/entities/disease.entity';
import { DiseaseDto } from 'src/dtos/disease.dto';

@Injectable()
export class FolkMedicineService {
  constructor(
    @InjectRepository(FolkMedicine)
    private readonly folkMedicineRepository: Repository<FolkMedicine>,
    @InjectRepository(FolkMedicineIngredient)
    private readonly ingredientRepository: Repository<FolkMedicineIngredient>,
    private readonly categoryService: CategoryService,
    private readonly authorService: AuthorService,
    private readonly dataSourceService: DataSourceService,
    private readonly diseaseService: DiseaseService,
    @InjectRepository(Disease)
    private readonly diseaseRepository: Repository<Disease>,
  ) { }

  async findPagination(params: PaginationParams): Promise<PaginatedResponse<FolkMedicine>> {
    const { page = 1, size = 10, search = '', categoryId = '' } = params;
    const skip = (page - 1) * size;

    let whereConditions: any = search ? [
      { title: Like(`%${search}%`) },
      { slug: Like(`%${search}%`) },
      { summary: Like(`%${search}%`) },
      { diseases: { name: Like(`%${search}%`) } },
    ] : {};

    if (categoryId) {
      if (Array.isArray(whereConditions)) {
        whereConditions = [...whereConditions, { categoryId: categoryId }];
      } else {
        whereConditions = { categoryId: categoryId };
      }
    }


    const [data, total] = await this.folkMedicineRepository.findAndCount({
      where: whereConditions,
      skip,
      take: size,
      relations: ['category', 'ingredientsDetail', 'ingredientsDetail.herbal', 'ingredientsDetail.unitCategory', 'diseases'],
      order: { id: 'DESC' },
    });

    return {
      data: plainToClass(FolkMedicine, data),
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  async create(data: FolkMedicineDto): Promise<FolkMedicine> {
    if (data.title) {
      data.slug = slugify(data.title, { lower: true, strict: true });
    }

    // Xử lý categoryId nếu có
    if (data.categoryId != null) {
      const categoryId = Base64EncryptionUtil.decrypt(data.categoryId.toString());
      data.categoryId = categoryId;
    }
    if (data.authorId != null) {
      const authorId = Base64EncryptionUtil.decrypt(data.authorId.toString());
      data.authorId = authorId;
    }

    if (data.dataSourceId != null) {
      const dataSourceId = Base64EncryptionUtil.decrypt(data.dataSourceId.toString());
      data.dataSourceId = dataSourceId;
    }

    data.id = undefined;
    const folkMedicine = this.folkMedicineRepository.create(data as DeepPartial<FolkMedicine>);
    folkMedicine.createdAt = new Date();
    folkMedicine.updatedAt = new Date();
    
    // add diseases to folk medicine
    if (data.diseases && Array.isArray(data.diseases)) {
      const diseases = await this.diseaseService.findAll(); // Lấy tất cả bệnh từ dịch vụ
      const diseaseIds = data.diseases.map(d => Base64EncryptionUtil.decrypt(d));
  
      // Lọc ra những bệnh mà không có trong hệ thống
      const newDiseases = diseases.filter(d => diseaseIds.includes(d.id));
      if (!folkMedicine.diseases) {
        folkMedicine.diseases = [];
      }
      folkMedicine.diseases.push(...newDiseases);
      await this.folkMedicineRepository.save(folkMedicine);
      return this.findOne(folkMedicine.id);
    }

    
    if (data.components && Array.isArray(data.components)) {
      const ingredients: DeepPartial<FolkMedicineIngredient>[] = data.components.map((c, index) => {
        const herbalId = Base64EncryptionUtil.decrypt(c.herbalId.toString());
        const unitCategoryId = c.unitCategoryId != null ? Base64EncryptionUtil.decrypt(c.unitCategoryId.toString()) : undefined;
        return {
          folkMedicineId: folkMedicine.id,
          herbalId,
          unitCategoryId: unitCategoryId,
          quantity: Number(c.quantity),
          note: c.note,
          sortOrder: c.sortOrder ?? index,
        };
      });

      await this.ingredientRepository.delete({ folkMedicineId: folkMedicine.id });
      await this.ingredientRepository.save(ingredients as any);
    }

    return this.findOne(folkMedicine.id);
  }

  async findAll(): Promise<FolkMedicine[]> {
    const folkMedicines = await this.folkMedicineRepository.find({
      relations: ['category'],
      order: { id: 'DESC' },
    });
    return plainToClass(FolkMedicine, folkMedicines);
  }

  async findOne(id: number): Promise<FolkMedicine> {
    const folkMedicine = await this.folkMedicineRepository.findOne({
      where: { id },
      relations: ['category', 'ingredientsDetail', 'ingredientsDetail.herbal', 'ingredientsDetail.unitCategory', 'diseases'],
    });
    if (!folkMedicine) throw new NotFoundException('Folk medicine not found');
    return plainToClass(FolkMedicine, folkMedicine);
  }

  async update(id: number, data: FolkMedicineDto): Promise<FolkMedicine> {
    const folkMedicine = await this.findOne(id);
    Object.assign(folkMedicine, {
      ...data,
      id: folkMedicine.id,
    });

    if (data.title) {
      folkMedicine.slug = slugify(data.title, { lower: true, strict: true });
    }

    if (data.authorId != null) {
      const authorId = Base64EncryptionUtil.decrypt(data.authorId.toString());
      folkMedicine.authorId = authorId;
      try {
        const author = await this.authorService.findOne(folkMedicine.authorId);
        folkMedicine.author = author ?? null;
      } catch (error) {
        folkMedicine.author = null;
      }
    }

    if (data.categoryId != null) {
      const categoryId = Base64EncryptionUtil.decrypt(data.categoryId.toString());
      folkMedicine.categoryId = categoryId;
      try {
        const category = await this.categoryService.findOne(categoryId);
        folkMedicine.category = category ?? null;
      } catch (error) {
        folkMedicine.category = null;
      }
    }

    if (data.dataSourceId != null) {
      const dataSourceId = Base64EncryptionUtil.decrypt(data.dataSourceId.toString());
      folkMedicine.dataSourceId = dataSourceId;
      try {
        const dataSource = await this.dataSourceService.findOne(dataSourceId);
        folkMedicine.dataSource = dataSource ?? null;
      } catch (error) {
        folkMedicine.dataSource = null;
      }
    }

    // update diseases if provided
    if (data.diseases && Array.isArray(data.diseases)) {
      const diseases = await this.diseaseService.findAll();
      const diseaseIds = data.diseases.map(d => Base64EncryptionUtil.decrypt(d));
      const newDiseases = diseases.filter(d => diseaseIds.includes(d.id));
      if (!folkMedicine.diseases) {
        folkMedicine.diseases = [];
      }
      folkMedicine.diseases.push(...newDiseases);
      await this.folkMedicineRepository.save(folkMedicine);
    }

    // update components if provided
    if (data.components) {
      const ingredients: DeepPartial<FolkMedicineIngredient>[] = data.components.map((c, index) => {
        const herbalId = Base64EncryptionUtil.decrypt(c.herbalId.toString());
        const unitCategoryId = c.unitCategoryId != null ? Base64EncryptionUtil.decrypt(c.unitCategoryId.toString()) : undefined;
        return <FolkMedicineIngredient>{
          folkMedicineId: folkMedicine.id,
          herbalId,
          unitCategoryId: unitCategoryId,
          quantity: Number(c.quantity),
          note: c.note,
          sortOrder: c.sortOrder ?? index,
        };
      });
      // update diseases if provided

      await this.ingredientRepository.delete({ folkMedicineId: folkMedicine.id });
      const savedIngredients = await this.ingredientRepository.save(ingredients as DeepPartial<FolkMedicineIngredient>[]);
      folkMedicine.ingredientsDetail = savedIngredients as FolkMedicineIngredient[];
    }

    folkMedicine.updatedAt = new Date();

    await this.folkMedicineRepository.save(folkMedicine);
    return this.findOne(folkMedicine.id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.folkMedicineRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Folk medicine not found');
  }

  async incrementViewCount(id: number): Promise<void> {
    await this.folkMedicineRepository.increment({ id }, 'viewCount', 1);
  }

  async incrementLikeCount(id: number): Promise<void> {
    await this.folkMedicineRepository.increment({ id }, 'likeCount', 1);
  }

  async findByCategory(categoryId: number): Promise<FolkMedicine[]> {
    const folkMedicines = await this.folkMedicineRepository.find({
      where: { categoryId, isActive: true },
      relations: ['author', 'category', 'ingredientsDetail', 'ingredientsDetail.herbal', 'ingredientsDetail.unitCategory', 'diseases'],
      order: { id: 'DESC' },
    });
    return plainToClass(FolkMedicine, folkMedicines);
  }

  async addDiseases(folkMedicineId: number, dto: DiseaseDto): Promise<FolkMedicine> {
    const folkMedicine = await this.findOne(folkMedicineId);
    const diseaseIds = dto.imagePaths?.map(imagePath => Base64EncryptionUtil.decrypt(imagePath)) ?? [];
    const diseases = await this.diseaseService.findAll();

    if (!folkMedicine.diseases) {
      folkMedicine.diseases = [];
    }

    // Merge diseases, avoiding duplicates
    const existingDiseaseIds = folkMedicine.diseases.map(d => d.id);
    const newDiseases = diseases.filter(d => !existingDiseaseIds.includes(d.id));
    folkMedicine.diseases = [...folkMedicine.diseases, ...newDiseases];

    await this.folkMedicineRepository.save(folkMedicine);
    return this.findOne(folkMedicineId);
  }

  async removeDiseases(folkMedicineId: number, dto: DiseaseDto): Promise<FolkMedicine> {
    const folkMedicine = await this.findOne(folkMedicineId);
    const diseaseIds = dto.imagePaths?.map(imagePath => Base64EncryptionUtil.decrypt(imagePath)) ?? [];
    if (folkMedicine.diseases) {
      folkMedicine.diseases = folkMedicine.diseases.filter(d => !diseaseIds.includes(d.id));
    }
    await this.folkMedicineRepository.save(folkMedicine);
    return this.findOne(folkMedicineId);
  }
} 