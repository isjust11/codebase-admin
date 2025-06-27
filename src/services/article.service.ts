import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Article } from '../entities/article.entity';
import slugify from 'slugify';
import { PaginatedResponse, PaginationParams } from 'src/dtos/filter.dto';
import { plainToClass } from 'class-transformer';
import { Base64EncryptionUtil } from 'src/utils/base64Encryption.util';
import { User } from 'src/entities/user.entity';

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

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
                 relations: ['author',],
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

  async create(data: Partial<Article>): Promise<Article> {
    if (data.title) {
      data.slug = slugify(data.title, { lower: true, strict: true }); 
    }
    
    // Xử lý authorId nếu có
    if (data.authorId != null) {
      const authorId = Base64EncryptionUtil.decrypt(data.authorId);
      data.authorId = parseInt(authorId, 10);
      
      const author = await this.userRepository.findOne({ 
        where: { id: data.authorId },
      });
      data.author = author ?? null;
    }
    
    const article = this.articleRepository.create(data);
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

  async update(id: number, data: Partial<Article>): Promise<Article> {
    const article = await this.findOne(id);
    Object.assign(article, data);
    
    if (article.title) {
      data.slug = slugify(article.title, { lower: true, strict: true }); 
    }
    
    if (data.authorId != null) {
      const authorId = Base64EncryptionUtil.decrypt(data.authorId);
      article.authorId = parseInt(authorId, 10);
      
      const author = await this.userRepository.findOne({ 
        where: { id: article.authorId },
      });
      article.author = author ?? null;
    }
    
    return this.articleRepository.save(article);
  }

  async remove(id: number): Promise<void> {
    const result = await this.articleRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Article not found');
  }
} 