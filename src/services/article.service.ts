import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Like, Repository } from 'typeorm';
import { Article } from '../entities/article.entity';
import slugify from 'slugify';
import { PaginatedResponse, PaginationParams } from 'src/dtos/filter.dto';
import { Base64EncryptionUtil } from 'src/utils/base64Encryption.util';
import { AuthorService } from './author.service';
import { CategoryService } from './category.service';
import { ArticleDto } from 'src/dtos/article.dto';
import { UserInteractionService } from './user-interaction.service';
import { InteractionTarget } from '../enums/interaction-target.enum';


@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    private readonly authorService: AuthorService,
    private readonly categoryService: CategoryService,
    private readonly userInteractionService: UserInteractionService
  ) { }

  async findPagination(params: PaginationParams, userId?: number): Promise<PaginatedResponse<any>> {
    const { page = 1, size = 10, search = '' } = params;
    const skip = (page - 1) * size;

    const whereConditions = search ? [
      { title: Like(`%${search}%`) },
      { slug: Like(`%${search}%`) },
    ] : {};

    const [articles, total] = await this.articleRepository.findAndCount({
      where: whereConditions,
      skip,
      take: size,
      relations: ['createdBy', 'updatedBy', 'status', 'category', 'author'],
      order: { id: 'DESC' },
    });

    // Enrich articles with interaction data
    const enrichedArticles = await Promise.all(
      articles.map(async (article) => {
        const interactionStats = await this.userInteractionService.getInteractionStats(
          InteractionTarget.ARTICLE,
          article.id
        );

        let userInteractionStatus = {};
        if (userId) {
          userInteractionStatus = await this.userInteractionService.getUserInteractionStatus(
            userId,
            InteractionTarget.ARTICLE,
            article.id
          );
        }

        return {
          ...article,
          interactionStats: {
            likeCount: interactionStats.likeCount,
            dislikeCount: interactionStats.dislikeCount,
            bookmarkCount: interactionStats.bookmarkCount,
            shareCount: interactionStats.shareCount,
            viewCount: interactionStats.viewCount,
            commentCount: interactionStats.commentCount,
            rateCount: interactionStats.rateCount,
            followCount: interactionStats.followCount,
            averageRating: interactionStats.averageRating,
          },
          userInteractionStatus,
        };
      })
    );

    return {
      data: enrichedArticles,
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

    if (data.dataSourceId != null) {
      const dataSourceId = Base64EncryptionUtil.decrypt(data.dataSourceId.toString());
      data.dataSourceId = dataSourceId;
    }

    if (data.authorId != null) {
      const authorId = Base64EncryptionUtil.decrypt(data.authorId.toString());
      data.authorId = authorId;
    }

    const article = this.articleRepository.create(data as DeepPartial<Article>);
    return this.articleRepository.save(article);
  }

  async findAll(): Promise<Article[]> {
    const articles = await this.articleRepository.find();
    return articles;
  }

  async findOne(id: number, userId?: number): Promise<any> {
    const article = await this.articleRepository.findOne({ 
      where: { id },
      relations: ['createdBy', 'updatedBy', 'status', 'category', 'author']
    });
    if (!article) throw new NotFoundException('Article not found');

    // Get interaction stats
    const interactionStats = await this.userInteractionService.getInteractionStats(
      InteractionTarget.ARTICLE,
      article.id
    );

    let userInteractionStatus = {};
    if (userId) {
      userInteractionStatus = await this.userInteractionService.getUserInteractionStatus(
        userId,
        InteractionTarget.ARTICLE,
        article.id
      );
    }

    return {
      ...article,
      interactionStats: {
        likeCount: interactionStats.likeCount,
        dislikeCount: interactionStats.dislikeCount,
        bookmarkCount: interactionStats.bookmarkCount,
        shareCount: interactionStats.shareCount,
        viewCount: interactionStats.viewCount,
        commentCount: interactionStats.commentCount,
        rateCount: interactionStats.rateCount,
        followCount: interactionStats.followCount,
        averageRating: interactionStats.averageRating,
      },
      userInteractionStatus,
    };
  }


  async updateView(id: number, data: ArticleDto): Promise<Article> {
    const article = await this.articleRepository.findOne({ where: { id } });
    if (!article) throw new NotFoundException('Article not found');
    
    Object.assign(article, {
      ...data,
      id: article.id,
      view: article.view + 1,
    });
    return this.articleRepository.save(article);
  }

  async update(id: number, data: ArticleDto): Promise<Article> {
    const article = await this.articleRepository.findOne({ where: { id } });
    if (!article) throw new NotFoundException('Article not found');
    
    Object.assign(article, {
      ...data,
      id: article.id,
    });

    if (article.title) {
      data.slug = slugify(article.title, { lower: true, strict: true });
    }

    if (data.statusId != null) {
      const statusId = Base64EncryptionUtil.decrypt(data.statusId.toString());
      article.statusId = statusId;
    }

    if (data.categoryId != null) {
      const categoryId = Base64EncryptionUtil.decrypt(data.categoryId.toString());
      article.categoryId = categoryId;

      const category = await this.categoryService.findOne(categoryId);
      article.category = category ?? undefined;
    }

    if (data.dataSourceId != null) {
      const dataSourceId = Base64EncryptionUtil.decrypt(data.dataSourceId.toString());
      article.dataSourceId = dataSourceId;
    }

    if (data.authorId != null) {
      const authorId = Base64EncryptionUtil.decrypt(data.authorId.toString());
      article.authorId = authorId;
    }

    return this.articleRepository.save(article);
  }

  async remove(id: number): Promise<void> {
    const result = await this.articleRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Article not found');
  }
} 