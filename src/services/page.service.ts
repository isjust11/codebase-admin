import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Like, Repository } from 'typeorm';
import { Page } from '../entities/page.entity';
import { CreatePageDto } from '../dtos/create-page.dto';
import { UpdatePageDto } from '../dtos/update-page.dto';
import slugify from 'slugify';
import { PaginatedResponse, PaginationParams } from 'src/dtos/filter.dto';

@Injectable()
export class PageService {
  constructor(
    @InjectRepository(Page)
    private pageRepository: Repository<Page>,
  ) { }
  async findPagination(params: PaginationParams) {
    const { page = 1, size = 10, search = '' } = params;
    const skip = (page - 1) * size;
    const whereConditions = search ? [
      { title: Like(`%${search}%`) },
      { slug: Like(`%${search}%`) },
    ] : {};

    const [data, total] = await this.pageRepository.findAndCount({
      where: whereConditions,
      skip,
      take: size,
      relations: ['createdBy', 'updatedBy'],
      order: { createdAt: 'DESC' },
    });

    return {
      data,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  async create(createPageDto: CreatePageDto): Promise<Page> {

    if (createPageDto.title) {
      createPageDto.slug = slugify(createPageDto.title, { lower: true, strict: true });
    }
    // Check if slug already exists
    const existingPage = await this.pageRepository.findOne({
      where: { slug: createPageDto.slug },
    });

    if (existingPage) {
      throw new ConflictException('Page with this slug already exists');
    }

    // Create page entity from DTO
    const pageData: DeepPartial<Page> = {
      ...createPageDto,
      createdBy: { id: createPageDto.createdBy },
      updatedBy: { id: createPageDto.createdBy }
    };
    const page = this.pageRepository.create(pageData);
    return await this.pageRepository.save(page);
  }

  async findAll(): Promise<Page[]> {
    return await this.pageRepository.find({
      relations: ['createdBy', 'updatedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findActive(): Promise<Page[]> {
    return await this.pageRepository.find({
      where: { isActive: true },
      relations: ['createdBy', 'updatedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Page> {
    const page = await this.pageRepository.findOne({
      where: { id },
      relations: ['createdBy', 'updatedBy'],
    });
    if (!page) {
      throw new NotFoundException('Page not found');
    }
    return page;
  }

  async findBySlug(slug: string): Promise<Page> {
    const page = await this.pageRepository.findOne({
      where: { slug }
    });
    if (!page) {
      throw new NotFoundException('Page not found');
    }
    return page;
  }

  async update(id: number, updatePageDto: UpdatePageDto): Promise<Page> {
    const page = await this.findOne(id);

    // Check if slug is being updated and if it already exists
    if (updatePageDto.title) {
      updatePageDto.slug = slugify(updatePageDto.title, { lower: true, strict: true });
    }
    if (updatePageDto.slug && updatePageDto.slug !== page.slug) {
      const existingPage = await this.pageRepository.findOne({
        where: { slug: updatePageDto.slug },
      });

      if (existingPage) {
        throw new ConflictException('Page with this slug already exists');
      }
    }

    Object.assign(page, updatePageDto);
    return await this.pageRepository.save(page);
  }

  async remove(id: number): Promise<void> {
    const page = await this.findOne(id);
    await this.pageRepository.remove(page);
  }

  async toggleActive(id: number): Promise<Page> {
    const page = await this.findOne(id);
    page.isActive = !page.isActive;
    return await this.pageRepository.save(page);
  }
}
