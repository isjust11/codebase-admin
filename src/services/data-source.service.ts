import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Like, Repository } from 'typeorm';
import { DataSource, DataSourceType } from '../entities/data-source.entity';
import { PaginatedResponse, PaginationParams } from 'src/dtos/filter.dto';
import { plainToClass } from 'class-transformer';
import { DataSourceDto } from 'src/dtos/data-source.dto';

@Injectable()
export class DataSourceService {
  constructor(
    @InjectRepository(DataSource)
    private readonly dataSourceRepository: Repository<DataSource>,
  ) {}

  async findPagination(params: PaginationParams): Promise<PaginatedResponse<DataSource>> {
    const { page = 1, size = 10, search = '' } = params;
    const skip = (page - 1) * size;

    let whereConditions: any = search ? [
      { name: Like(`%${search}%`) },
      { title: Like(`%${search}%`) },
      { description: Like(`%${search}%`) },
      { author: Like(`%${search}%`) },
      { publisher: Like(`%${search}%`) },
    ] : {};



    const [data, total] = await this.dataSourceRepository.findAndCount({
      where: whereConditions,
      skip,
      take: size,
      order: { id: 'DESC' },
    });

    return {
      data: plainToClass(DataSource, data),
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  async create(data: DataSourceDto): Promise<DataSource> {
    const dataSource = this.dataSourceRepository.create(data as DeepPartial<DataSource>);
    return this.dataSourceRepository.save(dataSource);
  }

  async findAll(): Promise<DataSource[]> {
    const dataSources = await this.dataSourceRepository.find({
      order: { id: 'DESC' },
    });
    return plainToClass(DataSource, dataSources);
  }

  async findOne(id: number): Promise<DataSource> {
    const dataSource = await this.dataSourceRepository.findOne({
      where: { id },
    });
    if (!dataSource) throw new NotFoundException('Data source not found');
    return plainToClass(DataSource, dataSource);
  }

  async update(id: number, data: DataSourceDto): Promise<DataSource> {
    const dataSource = await this.findOne(id);
    Object.assign(dataSource, data);
    return this.dataSourceRepository.save(dataSource);
  }

  async remove(id: number): Promise<void> {
    const result = await this.dataSourceRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Data source not found');
  }

  async getTypes(): Promise<{ value: DataSourceType; label: string }[]> {
    return Object.values(DataSourceType).map(type => ({
      value: type,
      label: this.getTypeLabel(type),
    }));
  }

  private getTypeLabel(type: DataSourceType): string {
    const labels = {
      [DataSourceType.WEBSITE]: 'Website',
      [DataSourceType.EBOOK]: 'E-book',
      [DataSourceType.BOOK]: 'Sách',
      [DataSourceType.JOURNAL]: 'Tạp chí',
      [DataSourceType.RESEARCH_PAPER]: 'Bài nghiên cứu',
      [DataSourceType.INTERVIEW]: 'Phỏng vấn',
      [DataSourceType.DOCUMENT]: 'Tài liệu',
      [DataSourceType.OTHER]: 'Khác',
    };
    return labels[type] || type;
  }
}