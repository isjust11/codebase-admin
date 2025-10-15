import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Author } from '../entities/author.entity';
import slugify from 'slugify';
import { PaginatedResponse, PaginationParams } from 'src/dtos/filter.dto';
import { Base64EncryptionUtil } from 'src/utils/base64Encryption.util';

@Injectable()
export class AuthorService {
  constructor(
    @InjectRepository(Author)
    private readonly authorRepository: Repository<Author>,
  ) {}

  async findPagination(params: PaginationParams): Promise<PaginatedResponse<Author>> {
    const { page = 1, size = 10, search = '' } = params;
    const skip = (page - 1) * size;

    const whereConditions = search ? [
      { name: Like(`%${search}%`) },
      { slug: Like(`%${search}%`) },
      { alias: Like(`%${search}%`) },
      { biography: Like(`%${search}%`) },
      { career: Like(`%${search}%`) },
      { achievements: Like(`%${search}%`) },
      { contributions: Like(`%${search}%`) },
      { works: Like(`%${search}%`) },
      { philosophy: Like(`%${search}%`) },
      { legacy: Like(`%${search}%`) },
      { era: Like(`%${search}%`) },
      { dynasty: Like(`%${search}%`) },
      { specialty: Like(`%${search}%`) },
    ] : {};

    const [data, total] = await this.authorRepository.findAndCount({
      where: whereConditions,
      skip,
      take: size,
      order: { id: 'DESC' },
    });

    return {
      data: data,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  async create(data: Partial<Author>): Promise<Author> {
    if (data.name) {
      data.slug = slugify(data.name, { lower: true, strict: true });
    }
    
    if (data.dataSourceId != null) {
      const dataSourceId = Base64EncryptionUtil.decrypt(data.dataSourceId.toString());
      data.dataSourceId = dataSourceId;
    }

    const author = this.authorRepository.create(data);
    return this.authorRepository.save(author);
  }

  async findAll(): Promise<Author[]> {
    const authors = await this.authorRepository.find({
      order: { id: 'DESC' },
    });
    return authors;
  }

  async findOne(id: number): Promise<Author> {
    const author = await this.authorRepository.findOne({
      where: { id },
    });
    if (!author) throw new NotFoundException('Author not found');
    return author;
  }

  async findBySlug(slug: string): Promise<Author> {
    const author = await this.authorRepository.findOne({
      where: { slug },
      relations: ['herbals', 'folkMedicines'],
    });
    if (!author) throw new NotFoundException('Author not found');
    return author;
  }

  async update(id: number, data: Partial<Author>): Promise<Author> {
    const author = await this.findOne(id);
    Object.assign(author, {...data, id: id});

    if (data.name) {
      data.slug = slugify(data.name, { lower: true, strict: true });
    }
    if(data.dataSourceId != null) {
      const dataSourceId = Base64EncryptionUtil.decrypt(data.dataSourceId.toString());
      author.dataSourceId = dataSourceId;
    }

    return this.authorRepository.save(author);
  }

  async remove(id: number): Promise<void> {
    const result = await this.authorRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Author not found');
  }

  async incrementViewCount(id: number): Promise<void> {
    await this.authorRepository.increment({ id }, 'viewCount', 1);
  }

  async incrementLikeCount(id: number): Promise<void> {
    await this.authorRepository.increment({ id }, 'likeCount', 1);
  }

  async findByEra(era: string): Promise<Author[]> {
    const authors = await this.authorRepository.find({
      where: { era: Like(`%${era}%`), isActive: true },
      relations: ['herbals', 'folkMedicines'],
      order: { id: 'DESC' },
    });
    return authors;
  }

  async findByDynasty(dynasty: string): Promise<Author[]> {
    const authors = await this.authorRepository.find({
      where: { dynasty: Like(`%${dynasty}%`), isActive: true },
      relations: ['herbals', 'folkMedicines'],
      order: { id: 'DESC' },
    });
    return authors;
  }

  async findBySpecialty(specialty: string): Promise<Author[]> {
    const authors = await this.authorRepository.find({
      where: { specialty: Like(`%${specialty}%`), isActive: true },
      relations: ['herbals', 'folkMedicines'],
      order: { id: 'DESC' },
    });
    return authors;
  }

  async findFamousAuthors(): Promise<Author[]> {
    const authors = await this.authorRepository.find({
      where: { isActive: true },
      relations: ['herbals', 'folkMedicines'],
      order: { viewCount: 'DESC', likeCount: 'DESC' },
      take: 10,
    });
    return authors;
  }

  async searchAuthors(query: string): Promise<Author[]> {
    const authors = await this.authorRepository.find({
      where: [
        { name: Like(`%${query}%`) },
        { alias: Like(`%${query}%`) },
        { biography: Like(`%${query}%`) },
        { career: Like(`%${query}%`) },
        { achievements: Like(`%${query}%`) },
        { works: Like(`%${query}%`) },
      ],
      relations: ['herbals', 'folkMedicines'],
      order: { viewCount: 'DESC' },
    });
    return authors;
  }
} 