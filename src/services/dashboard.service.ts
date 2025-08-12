import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Order } from '../entities/order.entity';
import { Product } from '../entities/product.entity';
import { Article } from '../entities/article.entity';
import { Author } from '../entities/author.entity';
import { Herbal } from '../entities/herbal.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Article)
    private articleRepository: Repository<Article>,
    @InjectRepository(Author)
    private authorRepository: Repository<Author>,
    @InjectRepository(Herbal)
    private herbalRepository: Repository<Herbal>,
  ) {}

  async getOverview() {
    const [
      totalUsers,
      totalOrders,
      totalRevenue,
      totalProducts,
      totalArticles,
      totalAuthors,
      totalHerbals,
    ] = await Promise.all([
      this.userRepository.count(),
      this.orderRepository.count(),
      this.orderRepository
        .createQueryBuilder('order')
        .select('SUM(order.totalAmount)', 'total')
        .where('order.statusId = :status', { status: 'completed' })
        .getRawOne(),
      this.productRepository.count(),
      this.articleRepository.count(),
      this.authorRepository.count(),
      this.herbalRepository.count(),
    ]);

    return {
      totalUsers,
      totalOrders,
      totalRevenue: totalRevenue?.total || 0,
      totalProducts,
      totalArticles,
      totalAuthors,
      totalHerbals,
    };
  }

  async getStatistics(period: string) {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const [
      newUsers,
      newOrders,
      newRevenue,
      newProducts,
      newArticles,
    ] = await Promise.all([
      this.userRepository.count({
        where: { createdAt: MoreThanOrEqual(startDate) },
      }),
      this.orderRepository.count({
        where: { createdAt: MoreThanOrEqual(startDate) },
      }),
      this.orderRepository
        .createQueryBuilder('order')
        .select('SUM(order.totalAmount)', 'total')
        .where('order.createdAt >= :startDate', { startDate })
        .andWhere('order.status = :status', { status: 'completed' })
        .getRawOne(),
      this.productRepository.count({
          where: { createdAt: MoreThanOrEqual(startDate) },
      }),
      this.articleRepository.count({
        where: { createdAt: MoreThanOrEqual(startDate) },
      }),
    ]);

    return {
      period,
      newUsers,
      newOrders,
      newRevenue: newRevenue?.total || 0,
      newProducts,
      newArticles,
    };
  }

  async getRecentActivities(limit: number) {
    const activities = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .select([
        'order.id',
        'order.totalAmount',
        'order.status',
        'order.createdAt',
        'user.name',
        'user.email',
      ])
      .orderBy('order.createdAt', 'DESC')
      .limit(limit)
      .getMany();

    return activities.map(activity => ({
      id: activity.id,
      type: 'order',
      description: `Đơn hàng ${activity.statusId} từ ${activity.account?.username}`,
      amount: activity.totalAmount,
      timestamp: activity.createdAt,
      user: activity.account?.username,
    }));
  }

  async getTopPerformers(type: string, limit: number) {
    switch (type) {
      case 'products':
        return this.productRepository
          .createQueryBuilder('product')
          .select([
            'product.id',
            'product.name',
            'product.price',
            'product.viewCount',
            'product.soldCount',
          ])
          .orderBy('product.soldCount', 'DESC')
          .limit(limit)
          .getMany();

      case 'articles':
        return this.articleRepository
          .createQueryBuilder('article')
          .select([
            'article.id',
            'article.title',
            'article.viewCount',
            'article.likeCount',
          ])
          .orderBy('article.viewCount', 'DESC')
          .limit(limit)
          .getMany();

      case 'authors':
        return this.authorRepository
          .createQueryBuilder('author')
          .select([
            'author.id',
            'author.name',
            'author.viewCount',
            'author.articleCount',
          ])
          .orderBy('author.viewCount', 'DESC')
          .limit(limit)
          .getMany();

      default:
        return [];
    }
  }

  async getRevenueAnalytics(period: string) {
    const now = new Date();
    let startDate: Date;
    let groupBy: string;

    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        groupBy = 'DATE(order.createdAt)';
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        groupBy = 'DATE(order.createdAt)';
        break;
      case '12m':
        startDate = new Date(now.getTime() - 12 * 30 * 24 * 60 * 60 * 1000);
        groupBy = 'DATE_FORMAT(order.createdAt, "%Y-%m")';
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        groupBy = 'DATE(order.createdAt)';
    }

    const revenueData = await this.orderRepository
      .createQueryBuilder('order')
      .select([
        `${groupBy} as date`,
        'SUM(order.totalAmount) as revenue',
        'COUNT(order.id) as orders',
      ])
      .where('order.createdAt >= :startDate', { startDate })
      .andWhere('order.statusId = :status', { status: 'completed'   })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    return revenueData;
  }

  async getUserGrowth(period: string) {
    const now = new Date();
    let startDate: Date;
    let groupBy: string;

    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        groupBy = 'DATE(user.createdAt)';
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        groupBy = 'DATE(user.createdAt)';
        break;
      case '12m':
        startDate = new Date(now.getTime() - 12 * 30 * 24 * 60 * 60 * 1000);
        groupBy = 'DATE_FORMAT(user.createdAt, "%Y-%m")';
        break;
      default:
        startDate = new Date(now.getTime() - 12 * 30 * 24 * 60 * 60 * 1000);
        groupBy = 'DATE_FORMAT(user.createdAt, "%Y-%m")';
    }

    const growthData = await this.userRepository
      .createQueryBuilder('user')
      .select([
        `${groupBy} as date`,
        'COUNT(user.id) as newUsers',
      ])
      .where('user.createdAt >= :startDate', { startDate })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    return growthData;
  }
}
