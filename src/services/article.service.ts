import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Like, Repository } from 'typeorm';
import { Article } from '../entities/article.entity';
import slugify from 'slugify';
import { PaginatedResponse, PaginationParams } from 'src/dtos/filter.dto';
import { plainToClass } from 'class-transformer';
import { Base64EncryptionUtil } from 'src/utils/base64Encryption.util';
import { AuthorService } from './author.service';
import { CategoryService } from './category.service';
import { ArticleDto } from 'src/dtos/article.dto';


@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    private readonly authorService: AuthorService,
    private readonly categoryService: CategoryService
  ) { }

  async findPagination(params: PaginationParams): Promise<PaginatedResponse<Article>> {
    const { page = 1, size = 10, search = '' } = params;
    const skip = (page - 1) * size;

    const whereConditions = search ? [
      { title: Like(`%${search}%`) },
      { slug: Like(`%${search}%`) },
    ] : {};

    const [data, total] = await this.articleRepository.findAndCount({
      where: whereConditions,
      skip,
      take: size,
      relations: ['createdBy', 'updatedBy', 'status', 'category'],
      order: { id: 'DESC' },
    });

    return {
      data: plainToClass(Article, data),
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  async create(data: ArticleDto): Promise<Article> {
    if (data.title) {
      data.slug = slugify(data.title, { lower: true, strict: true });
    }
    if (data.categoryId != null) {
      const categoryId = Base64EncryptionUtil.decrypt(data.categoryId.toString());
      data.categoryId = categoryId;
    }

    if (data.statusId != null) {
      const statusId = Base64EncryptionUtil.decrypt(data.statusId.toString());
      data.statusId = statusId;
    }

    const article = this.articleRepository.create(data as DeepPartial<Article>);
    return this.articleRepository.save(article);
  }

  async findAll(): Promise<Article[]> {
    const articles = await this.articleRepository.find();
    return plainToClass(Article, articles);
  }

  async findOne(id: number): Promise<Article> {
    const article = await this.articleRepository.findOne({ where: { id } });
    if (!article) throw new NotFoundException('Article not found');
    return plainToClass(Article, article);
  }

  async update(id: number, data: ArticleDto): Promise<Article> {
    const article = await this.findOne(id);
    Object.assign(article, data);

    if (article.title) {
      data.slug = slugify(article.title, { lower: true, strict: true });
    }

    if (data.statusId != null) {
      const statusId = Base64EncryptionUtil.decrypt(data.statusId.toString());
      article.statusId = parseInt(statusId, 10);
    }

    if (data.categoryId != null) {
      const categoryId = Base64EncryptionUtil.decrypt(data.categoryId.toString());
      article.categoryId = parseInt(categoryId, 10);

      const category = await this.categoryService.findOne(parseInt(categoryId, 10));
      article.category = category ?? undefined;
    }

    return this.articleRepository.save(article);
  }

  async remove(id: number): Promise<void> {
    const result = await this.articleRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Article not found');
  }
} 