import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, FindOptionsWhere } from 'typeorm';
import { Product } from '../entities/product.entity';
import { CreateProductDto, UpdateProductDto, ProductFilterDto } from '../dtos/product.dto';
import { PaginationParams } from '../dtos/filter.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto, userId: string): Promise<Product> {
    const product = this.productRepository.create({
      ...createProductDto,
      createdById: userId,
      updatedById: userId,
    });
    return this.productRepository.save(product);
  }

  async findAll(): Promise<Product[]> {
    return this.productRepository.find({
      relations: ['category', 'createdBy', 'updatedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAllWithPagination(filter: PaginationParams & ProductFilterDto): Promise<{
    data: Product[];
    total: number;
    page: number;
    size: number;
    totalPages: number;
  }> {
    const { page = 1, size = 10, search, categoryId, isActive, isFeatured, minPrice, maxPrice, brand, sortBy, sortOrder } = filter;

    const whereConditions: FindOptionsWhere<Product> = {};

    if (search) {
      whereConditions.name = Like(`%${search}%`);
    }

    if (categoryId) {
      whereConditions.categoryId = categoryId;
    }

    if (isActive !== undefined) {
      whereConditions.isActive = isActive;
    }

    if (isFeatured !== undefined) {
      whereConditions.isFeatured = isFeatured;
    }

    if (brand) {
      whereConditions.brand = Like(`%${brand}%`);
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      whereConditions.price = Between(minPrice || 0, maxPrice || 999999999);
    }

    const orderBy = sortBy || 'createdAt';
    const orderDirection = sortOrder || 'DESC';

    const [data, total] = await this.productRepository.findAndCount({
      where: whereConditions,
      relations: ['category', 'createdBy', 'updatedBy'],
      order: { [orderBy]: orderDirection },
      skip: (page - 1) * size,
      take: size,
    });

    return {
      data,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  async findById(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['category', 'createdBy', 'updatedBy'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async findBySlug(slug: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { slug },
      relations: ['category', 'createdBy', 'updatedBy'],
    });

    if (!product) {
      throw new NotFoundException(`Product with slug ${slug} not found`);
    }

    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto, userId: string): Promise<Product> {
    const product = await this.findById(id);

    Object.assign(product, {
      ...updateProductDto,
      updatedById: userId,
    });

    return this.productRepository.save(product);
  }

  async remove(id: number): Promise<void> {
    const product = await this.findById(id);
    await this.productRepository.remove(product);
  }

  async toggleActive(id: number, userId: string): Promise<Product> {
    const product = await this.findById(id);
    product.isActive = !product.isActive;
    product.updatedById = userId;
    return this.productRepository.save(product);
  }

  async toggleFeatured(id: number, userId: string): Promise<Product> {
    const product = await this.findById(id);
    product.isFeatured = !product.isFeatured;
    product.updatedById = userId;
    return this.productRepository.save(product);
  }

  async incrementViewCount(id: number): Promise<void> {
    await this.productRepository.increment({ id }, 'viewCount', 1);
  }

  async updateStock(id: number, quantity: number): Promise<Product> {
    const product = await this.findById(id);
    
    if (product.stock + quantity < 0) {
      throw new BadRequestException('Insufficient stock');
    }

    product.stock += quantity;
    return this.productRepository.save(product);
  }

  async getFeaturedProducts(limit: number = 10): Promise<Product[]> {
    return this.productRepository.find({
      where: { isFeatured: true, isActive: true },
      relations: ['category'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getProductsByCategory(categoryId: string, limit: number = 20): Promise<Product[]> {
    return this.productRepository.find({
      where: { categoryId, isActive: true },
      relations: ['category'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async searchProducts(query: string, limit: number = 20): Promise<Product[]> {
    return this.productRepository.find({
      where: [
        { name: Like(`%${query}%`), isActive: true },
        { description: Like(`%${query}%`), isActive: true },
        { brand: Like(`%${query}%`), isActive: true },
      ],
      relations: ['category'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
} 