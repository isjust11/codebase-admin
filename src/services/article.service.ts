import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, In, Like, MoreThan, Repository, Brackets } from 'typeorm';
import { Article } from '../entities/article.entity';
import slugify from 'slugify';
import { PaginatedResponse, PaginationParams } from 'src/dtos/filter.dto';
import { Base64EncryptionUtil } from 'src/utils/base64Encryption.util';
import { AuthorService } from './author.service';
import { CategoryService } from './category.service';
import { ArticleDto } from 'src/dtos/article.dto';
import { UserInteractionService } from './user-interaction.service';
import { InteractionTarget } from '../enums/interaction-target.enum';
import { InteractionStats } from '../entities/interaction-stats.entity';
import { CategoryTypeService } from './category-type.service';
import { CategoryTypeEnum } from 'src/enums/category-type.enum';


@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    private readonly authorService: AuthorService,
    private readonly categoryService: CategoryService,
    private readonly categoryTypeService: CategoryTypeService,
    private readonly userInteractionService: UserInteractionService
  ) { }

  async findPagination(params: PaginationParams, userId?: number, articleCode?: string, categoryId?: number): Promise<PaginatedResponse<any>> {
    const { page = 1, size = 10, search = '' } = params;
    const skip = (page - 1) * size;

    const whereConditions = search ? [
      { title: Like(`%${search}%`) },
      { slug: Like(`%${search}%`) },
    ] : {};

    if (articleCode) {
      const articleType = await this.categoryTypeService.findByCode(articleCode);
      if (articleType) {
        if (categoryId) {
          const category = await this.categoryService.findOne(categoryId);
          if (category?.code.toLowerCase() === "all") {
            Object.assign(whereConditions, { categoryId: In(articleType.categories.map(cat => cat.id)) });
          } else {
            Object.assign(whereConditions, { categoryId });
          }
        } else {
          Object.assign(whereConditions, { categoryId: In(articleType.categories.map(cat => cat.id)) });
        }
      }
    }

    const [articles, total] = await this.articleRepository.findAndCount({
      where: whereConditions,
      skip,
      take: size,
      relations: ['createdBy', 'updatedBy', 'status', 'category', 'author', 'dataSource'],
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

  async findAll(): Promise<Article[]> {
    const articles = await this.articleRepository.find();
    return articles;
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

    if (data.articleTypeId != null) {
      const articleTypeId = Base64EncryptionUtil.decrypt(data.articleTypeId.toString());
      data.articleTypeId = articleTypeId;
    }

    const article = this.articleRepository.create(data as DeepPartial<Article>);
    return this.articleRepository.save(article);
  }

  async findByDiscovery(params: PaginationParams, categoryId: number): Promise<Article[]> {
    const { page = 1, size = 10, search = '' } = params;
    const category = await this.categoryService.findOne(categoryId);
    if (!category) throw new NotFoundException('Category not found');
    if (category.code.toLowerCase() == "all") {
      const allCategory = await this.categoryTypeService.findArticleType();
      const categoryIds = allCategory.map(cat => cat.id);
      const articles = await this.articleRepository.find({
        where: {
          categoryId: In(categoryIds)
        }
      });
      return articles;
    }
    const articles = await this.articleRepository.find(
      { where: { categoryId } }
    );
    return articles;
  }

  //get list tips
  async getTipList(params: PaginationParams, categoryId: number): Promise<Article[]> {
    const { page = 1, size = 10, search = '' } = params;
    const tipType = await this.categoryTypeService.findByCode(CategoryTypeEnum.TIPS);
    if (!tipType) throw new NotFoundException('Tip type not found');
    if (!categoryId || categoryId == 0) {
      const tipType = await this.categoryTypeService.findTipType();
      if (!tipType) throw new NotFoundException('Tip type not found');
      const categoryIds = tipType.categories.map(cat => cat.id);
      const articles = await this.articleRepository.find({
        where: { categoryId: In(categoryIds), title: Like(`%${search}%`) },
      skip: (page - 1) * size,
      take: size,
      relations: ['createdBy', 'updatedBy', 'status', 'category', 'author'],
        order: { id: 'DESC' },
      });
      return articles;
    }
    return await this.articleRepository.find({
      where: { categoryId, title: Like(`%${search}%`) },
      skip: (page - 1) * size,
      take: size,
      relations: ['createdBy', 'updatedBy', 'status', 'category', 'author'],
      order: { id: 'DESC' },
    });
  }

  // get tip detail 
  async getTipDetails(id: number): Promise<Article> {
    const article = await this.articleRepository.findOne({ where: { id } });
    if (!article) throw new NotFoundException('Article not found');
    return article;
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

    if (data.articleTypeId != null) {
      const articleTypeId = Base64EncryptionUtil.decrypt(data.articleTypeId.toString());
      article.articleTypeId = articleTypeId;
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

  // get featured news list
  async getFeaturedList(): Promise<any[]> {
    // lấy 3 tin tức có lượt view cao nhất theo InteractionStats.viewCount
    const qb = this.articleRepository.createQueryBuilder('article');
    qb
      .leftJoin(InteractionStats, 'stats', 'stats.targetId = article.id')
      .andWhere('stats.targetType = :type', { type: InteractionTarget.ARTICLE })
      .andWhere('stats.viewCount > 0')
      .orderBy('stats.viewCount', 'DESC')
      .take(3)
      .select([
        'article.id',
        'article.title', 
        'article.slug',
        'article.summary',
        'article.thumbnail',
        'article.view',
        'article.like',
        'article.categoryId',
        'article.authorId',
        'article.createdAt',
        'article.updatedAt'
      ])
      .addSelect('stats.viewCount', 'viewCount')
      .addSelect('stats.likeCount', 'likeCount');

    const results = await qb.getRawMany();

    // Map kết quả raw thành format mong muốn
    return results.map((row) => ({
      id: row.article_id,
      title: row.article_title,
      slug: row.article_slug,
      summary: row.article_summary,
      thumbnail: row.article_thumbnail,
      view: row.article_view,
      like: row.article_like,
      categoryId: row.article_categoryId,
      authorId: row.article_authorId,
      createdAt: row.article_createdAt,
      updatedAt: row.article_updatedAt,
      interactionStats: {
        viewCount: Number(row.viewCount ?? 0),
        likeCount: Number(row.likeCount ?? 0),
      },
    }));
  }

  // get trending news list
  async getTrendingList(params: PaginationParams): Promise<any[]> {
    const { page = 1, size = 10, search = '' } = params;
    
    const qb = this.articleRepository.createQueryBuilder('article');
    
    // Join với InteractionStats để lấy thống kê
    qb.leftJoin(InteractionStats, 'stats', 'stats.targetId = article.id')
      .andWhere('stats.targetType = :type', { type: InteractionTarget.ARTICLE })
      .andWhere('stats.likeCount > 0');
    
    // Thêm search condition nếu có
    if (search) {
      qb.andWhere('article.title LIKE :search', { search: `%${search}%` });
    }
    
    const results = await qb
      .orderBy('stats.likeCount', 'DESC')
      .addOrderBy('stats.viewCount', 'DESC')
      .addOrderBy('article.createdAt', 'DESC')
      .skip((page - 1) * size)
      .take(size)
      .select([
        'article.id',
        'article.title', 
        'article.slug',
        'article.summary',
        'article.thumbnail',
        'article.view',
        'article.like',
        'article.categoryId',
        'article.authorId',
        'article.createdAt',
        'article.updatedAt',
        'stats.likeCount',
        'stats.viewCount'
      ])
      .getRawMany();

    return results.map((row) => ({
      id: row.article_id,
      title: row.article_title,
      slug: row.article_slug,
      summary: row.article_summary,
      thumbnail: row.article_thumbnail,
      view: row.article_view,
      like: row.article_like,
      categoryId: row.article_categoryId,
      authorId: row.article_authorId,
      createdAt: row.article_createdAt,
      updatedAt: row.article_updatedAt,
      interactionStats: {
        likeCount: Number(row.stats_likeCount ?? 0),
        viewCount: Number(row.stats_viewCount ?? 0),
      },
    }));
  }

  // get favorites news list
  async getFavoritesList(params: PaginationParams): Promise<any[]> {
    const { page = 1, size = 10, search = '' } = params;
    
    const qb = this.articleRepository.createQueryBuilder('article');
    
    // Join với InteractionStats để lấy thống kê
    qb.leftJoin(InteractionStats, 'stats', 'stats.targetId = article.id')
      .andWhere('stats.targetType = :type', { type: InteractionTarget.ARTICLE })
      .andWhere('stats.likeCount > 0'); // Chỉ lấy những bài có lượt thích
    
    // Thêm search condition nếu có
    if (search) {
      qb.andWhere('article.title LIKE :search', { search: `%${search}%` });
    }
    
    const results = await qb
      .orderBy('stats.likeCount', 'DESC')
      .addOrderBy('stats.viewCount', 'DESC')
      .addOrderBy('article.createdAt', 'DESC')
      .skip((page - 1) * size)
      .take(size)
      .select([
        'article.id',
        'article.title', 
        'article.slug',
        'article.summary',
        'article.thumbnail',
        'article.view',
        'article.like',
        'article.categoryId',
        'article.authorId',
        'article.createdAt',
        'article.updatedAt',
        'stats.likeCount',
        'stats.viewCount'
      ])
      .getRawMany();

    return results.map((row) => ({
      id: row.article_id,
      title: row.article_title,
      slug: row.article_slug,
      summary: row.article_summary,
      thumbnail: row.article_thumbnail,
      view: row.article_view,
      like: row.article_like,
      categoryId: row.article_categoryId,
      authorId: row.article_authorId,
      createdAt: row.article_createdAt,
      updatedAt: row.article_updatedAt,
      interactionStats: {
        likeCount: Number(row.stats_likeCount ?? 0),
        viewCount: Number(row.stats_viewCount ?? 0),
      },
    }));
  }

  // get recent news list
  async getRecentList(params: PaginationParams): Promise<any[]> {
    const { page = 1, size = 10, search = '' } = params;
    
    const qb = this.articleRepository.createQueryBuilder('article');
    
    // Join với InteractionStats để lấy thống kê
    qb.leftJoin(InteractionStats, 'stats', 'stats.targetId = article.id')
      .andWhere('stats.targetType = :type', { type: InteractionTarget.ARTICLE })
      .andWhere('stats.viewCount > 0'); // Chỉ lấy những bài đã được xem
    
    // Thêm search condition nếu có
    if (search) {
      qb.andWhere('article.title LIKE :search', { search: `%${search}%` });
    }
    
    const results = await qb
      .orderBy('article.updatedAt', 'DESC') // Sắp xếp theo thời gian cập nhật
      .addOrderBy('stats.viewCount', 'DESC')
      .addOrderBy('stats.likeCount', 'DESC')
      .skip((page - 1) * size)
      .take(size)
      .select([
        'article.id',
        'article.title', 
        'article.slug',
        'article.summary',
        'article.thumbnail',
        'article.view',
        'article.like',
        'article.categoryId',
        'article.authorId',
        'article.createdAt',
        'article.updatedAt',
        'stats.likeCount',
        'stats.viewCount'
      ])
      .getRawMany();

    return results.map((row) => ({
      id: row.article_id,
      title: row.article_title,
      slug: row.article_slug,
      summary: row.article_summary,
      thumbnail: row.article_thumbnail,
      view: row.article_view,
      like: row.article_like,
      categoryId: row.article_categoryId,
      authorId: row.article_authorId,
      createdAt: row.article_createdAt,
      updatedAt: row.article_updatedAt,
      interactionStats: {
        likeCount: Number(row.stats_likeCount ?? 0),
        viewCount: Number(row.stats_viewCount ?? 0),
      },
    }));
  }

  // get bookmarked news list
  async getBookmarkedList(params: PaginationParams): Promise<any[]> {
    const { page = 1, size = 10, search = '' } = params;
    
    const qb = this.articleRepository.createQueryBuilder('article');
    
    // Join với InteractionStats để lấy thống kê
    qb.leftJoin(InteractionStats, 'stats', 'stats.targetId = article.id')
      .andWhere('stats.targetType = :type', { type: InteractionTarget.ARTICLE })
      .andWhere('stats.bookmarkCount > 0'); // Chỉ lấy những bài đã được bookmark
    
    // Thêm search condition nếu có
    if (search) {
      qb.andWhere('article.title LIKE :search', { search: `%${search}%` });
    }
    
    const results = await qb
      .orderBy('stats.bookmarkCount', 'DESC')
      .addOrderBy('stats.likeCount', 'DESC')
      .addOrderBy('stats.viewCount', 'DESC')
      .addOrderBy('article.createdAt', 'DESC')
      .skip((page - 1) * size)
      .take(size)
      .select([
        'article.id',
        'article.title', 
        'article.slug',
        'article.summary',
        'article.thumbnail',
        'article.view',
        'article.like',
        'article.categoryId',
        'article.authorId',
        'article.createdAt',
        'article.updatedAt',
        'stats.likeCount',
        'stats.viewCount',
        'stats.bookmarkCount'
      ])
      .getRawMany();

    return results.map((row) => ({
      id: row.article_id,
      title: row.article_title,
      slug: row.article_slug,
      summary: row.article_summary,
      thumbnail: row.article_thumbnail,
      view: row.article_view,
      like: row.article_like,
      categoryId: row.article_categoryId,
      authorId: row.article_authorId,
      createdAt: row.article_createdAt,
      updatedAt: row.article_updatedAt,
      interactionStats: {
        likeCount: Number(row.stats_likeCount ?? 0),
        viewCount: Number(row.stats_viewCount ?? 0),
        bookmarkCount: Number(row.stats_bookmarkCount ?? 0),
      },
    }));
  }

  async getRecommendList(searchData: string): Promise<any[]> {
    // Parse comma-separated keywords
    const keywords = (searchData || '')
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    if (keywords.length === 0) {
      return [];
    }

    const qb = this.articleRepository.createQueryBuilder('article');

    // Join interaction stats for engagement-based ordering
    qb.leftJoin(InteractionStats, 'stats', 'stats.targetId = article.id')
      .andWhere('stats.targetType = :type', { type: InteractionTarget.ARTICLE });

    // Build OR conditions across keywords (title, summary, slug)
    qb.andWhere(
      new Brackets((qbWhere) => {
        keywords.forEach((kw, index) => {
          const param = `kw${index}`;
          const likeValue = `%${kw}%`;
          qbWhere.orWhere(
            new Brackets((q) => {
              q.where(`article.title LIKE :${param}`, { [param]: likeValue })
                .orWhere(`article.summary LIKE :${param}`, { [param]: likeValue })
                .orWhere(`article.slug LIKE :${param}`, { [param]: likeValue });
            })
          );
        });
      })
    );

    // Compute a simple match score based on number of keyword matches in title and summary
    const matchScoreExpr = keywords
      .map((kw, index) => {
        const p = `ms${index}`;
        const likeVal = `%${kw}%`;
        // CASE WHEN title LIKE :msX THEN 2 ELSE 0 END + CASE WHEN summary LIKE :msX THEN 1 ELSE 0 END
        qb.setParameter(p, likeVal);
        return `CASE WHEN article.title LIKE :${p} THEN 2 ELSE 0 END + CASE WHEN article.summary LIKE :${p} THEN 1 ELSE 0 END`;
      })
      .join(' + ');

    if (matchScoreExpr.length > 0) {
      qb.addSelect(`(${matchScoreExpr})`, 'matchScore');
    }

    qb
      .select([
        'article.id',
        'article.title',
        'article.slug',
      ])
      .addSelect('COALESCE(stats.viewCount, 0)', 'viewCount')
      .addSelect('COALESCE(stats.likeCount, 0)', 'likeCount')
      .orderBy('matchScore', 'DESC')
      .addOrderBy('stats.likeCount', 'DESC')
      .addOrderBy('stats.viewCount', 'DESC')
      .addOrderBy('article.updatedAt', 'DESC')
      .take(10);

    const results = await qb.getRawMany();

    return results.map((row) => ({
      id: row.article_id,
      title: row.article_title,
      slug: row.article_slug,
      interactionStats: {
        viewCount: Number(row.viewCount ?? 0),
        likeCount: Number(row.likeCount ?? 0),
      },
      matchScore: Number(row.matchScore ?? 0),
    }));
  }
} 