import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { ProductComplaint } from '../entities/product-complaint.entity';
import { PaginatedResponse, PaginationParams } from 'src/dtos/filter.dto';
import { plainToClass } from 'class-transformer';

@Injectable()
export class ProductComplaintService {
  constructor(
    @InjectRepository(ProductComplaint)
    private readonly productComplaintRepository: Repository<ProductComplaint>
  ) {}

  async findPagination(params: PaginationParams): Promise<PaginatedResponse<ProductComplaint>> {
    const { page = 1, size = 10, search = '' } = params;
    const skip = (page - 1) * size;

    const whereConditions = search ? [
      { title: Like(`%${search}%`) },
      { description: Like(`%${search}%`) },
    ] : {};

    const [data, total] = await this.productComplaintRepository.findAndCount({
      where: whereConditions,
      skip,
      take: size,
      order: { id: 'DESC' },
    });

    return {
      data: plainToClass(ProductComplaint, data),
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  async create(data: Partial<ProductComplaint>): Promise<ProductComplaint> {
    const productComplaint = this.productComplaintRepository.create(data);
    return this.productComplaintRepository.save(productComplaint);
  }

  async findOne(id: number): Promise<ProductComplaint> {
    const productComplaint = await this.productComplaintRepository.findOne({
      where: { id },
    });
    if (!productComplaint) throw new NotFoundException('Product complaint not found');
    return plainToClass(ProductComplaint, productComplaint);
  }

  async update(id: number, data: Partial<ProductComplaint>): Promise<ProductComplaint> {
    const productComplaint = await this.findOne(id);
    Object.assign(productComplaint, {
      ...data,
      id: id,
    });

    return this.productComplaintRepository.save(productComplaint);
  }

  async remove(id: number): Promise<void> {
    const result = await this.productComplaintRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Product complaint not found');
  }
} 