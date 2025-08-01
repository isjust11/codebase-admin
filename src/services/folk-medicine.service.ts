import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { FolkMedicine } from '../entities/folk-medicine.entity';
import { User } from '../entities/user.entity';
import { Category } from '../entities/category.entity';
import slugify from 'slugify';
import { PaginatedResponse, PaginationParams } from 'src/dtos/filter.dto';
import { plainToClass } from 'class-transformer';
import { Base64EncryptionUtil } from 'src/utils/base64Encryption.util';

@Injectable()
export class FolkMedicineService {
  constructor(
    @InjectRepository(FolkMedicine)
    private readonly folkMedicineRepository: Repository<FolkMedicine>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async findPagination(params: PaginationParams): Promise<PaginatedResponse<FolkMedicine>> {
    const { page = 1, size = 10, search = '', categoryId = '' } = params;
    const skip = (page - 1) * size;

    let whereConditions: any = search ? [
      { title: Like(`%${search}%`) },
      { slug: Like(`%${search}%`) },
      { summary: Like(`%${search}%`) },
    ] : {};

    if (categoryId) {
      if(Array.isArray(whereConditions)) {
        whereConditions  = [...whereConditions, { categoryId: categoryId }];
      } else {
        whereConditions = { categoryId: categoryId };
      }
    }


    const [data, total] = await this.folkMedicineRepository.findAndCount({
      where: whereConditions,
      skip,
      take: size,
      relations: [ 'category'],
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

  async create(data: Partial<FolkMedicine>): Promise<FolkMedicine> {
    if (data.title) {
      data.slug = slugify(data.title, { lower: true, strict: true });
    }

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
      const categoryId = Base64EncryptionUtil.decrypt(data.categoryId);
      data.categoryId = categoryId;

      const category = await this.categoryRepository.findOne({
        where: { id: data.categoryId },
      });
      data.category = category ?? null;
    }

    const folkMedicine = this.folkMedicineRepository.create(data);
    return this.folkMedicineRepository.save(folkMedicine);
  }

  async findAll(): Promise<FolkMedicine[]> {
    const folkMedicines = await this.folkMedicineRepository.find({
      relations: ['author', 'category'],
      order: { id: 'DESC' },
    });
    return plainToClass(FolkMedicine, folkMedicines);
  }

  async findOne(id: number): Promise<FolkMedicine> {
    const folkMedicine = await this.folkMedicineRepository.findOne({
      where: { id },
      relations: ['author', 'category'],
    });
    if (!folkMedicine) throw new NotFoundException('Folk medicine not found');
    return plainToClass(FolkMedicine, folkMedicine);
  }

  async update(id: number, data: Partial<FolkMedicine>): Promise<FolkMedicine> {
    const folkMedicine = await this.findOne(id);
    Object.assign(folkMedicine, data);

    if (data.title) {
      data.slug = slugify(data.title, { lower: true, strict: true });
    }

    if (data.authorId != null) {
      // const authorId = Base64EncryptionUtil.decrypt(data.authorId);
      // folkMedicine.authorId = parseInt(authorId, 10);

      // const author = await this.userRepository.findOne({
      //   where: { id: folkMedicine.authorId },
      // });
      // folkMedicine.author = author ?? null;
    }

    if (data.categoryId != null) {
      const categoryId = Base64EncryptionUtil.decrypt(data.categoryId);
      folkMedicine.categoryId = categoryId;

      const category = await this.categoryRepository.findOne({
        where: { id: folkMedicine.categoryId },
      });
      folkMedicine.category = category ?? null;
    }

    return this.folkMedicineRepository.save(folkMedicine);
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

  async findByCategory(categoryId: string): Promise<FolkMedicine[]> {
    const folkMedicines = await this.folkMedicineRepository.find({
      where: { categoryId, isActive: true },
      relations: ['author', 'category'],
      order: { id: 'DESC' },
    });
    return plainToClass(FolkMedicine, folkMedicines);
  }
} 