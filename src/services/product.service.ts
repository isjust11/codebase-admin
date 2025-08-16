import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import slugify from 'slugify';
import { PaginatedResponse, PaginationParams } from 'src/dtos/filter.dto';
import { plainToClass } from 'class-transformer';
import { CategoryService } from './category.service';
import { Base64EncryptionUtil } from 'src/utils/base64Encryption.util';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly categoryService: CategoryService
  ) {}

  async findPagination(params: PaginationParams): Promise<PaginatedResponse<Product>> {
    const { page = 1, size = 10, search = '' } = params;
    const skip = (page - 1) * size;

    const whereConditions = search ? [
      { title: Like(`%${search}%`) },
      { slug: Like(`%${search}%`) },
      { description: Like(`%${search}%`) },
    ] : {};

    const [data, total] = await this.productRepository.findAndCount({
      where: whereConditions,
      skip,
      take: size,
      relations: ['category'],
      order: { id: 'DESC' },
    });

    return {
      data: plainToClass(Product, data),
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  async create(data: Partial<Product>): Promise<Product> {
    if (data.title) {
      data.slug = slugify(data.title, { lower: true, strict: true });
    }

    if (data.categoryId != null) {
      const categoryId = Base64EncryptionUtil.decrypt(data.categoryId.toString());
      data.categoryId = parseInt(categoryId, 10);

      const category = await this.categoryService.findOne(data.categoryId);
      data.category = category ?? undefined;
    }

    const product = this.productRepository.create(data);
    return this.productRepository.save(product);
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['category', 'images'],
    });
    if (!product) throw new NotFoundException('Product not found');
    return plainToClass(Product, product);
  }

  async update(id: number, data: Partial<Product>): Promise<Product> {
    const product = await this.findOne(id);
    Object.assign(product, {
      ...data,
      id: id,
    });

    if (data.title) {
      data.slug = slugify(data.title, { lower: true, strict: true });
    }

    if (data.categoryId != null) {
      const categoryId = data.categoryId;
      product.categoryId = categoryId;

      const category = await this.categoryService.findOne(product.categoryId);
      // product.category = category;
    }

    return this.productRepository.save(product);
  }

  async remove(id: number): Promise<void> {
    const result = await this.productRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Product not found');
  }
} 