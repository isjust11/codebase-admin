import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Article } from '../entities/article.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Article)
    private articleRepository: Repository<Article>,
  ) {}

  async getOverview() {
    const [
      totalUsers,
      totalOrders,
    ] = await Promise.all([
      this.userRepository.count(),
      this.articleRepository.count(),
    ]);

    return {
      totalUsers,
      totalOrders,
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
    ] = await Promise.all([
      this.userRepository.count({
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
    };
  }

  async getRecentActivities(limit: number) {
    const activities = await this.articleRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.account', 'user')
      .select([
        'order.id',
        'order.totalAmount',
        'order.statusId',
        'order.createdAt',
        'user.fullName',
        'user.email',
      ])
      .orderBy('order.createdAt', 'DESC')
      .limit(limit)
      .getMany();

    return activities.map(activity => ({
      id: activity.id,
      type: 'order',
    }));
  }

  async getTopPerformers(type: string, limit: number) {
    switch (type) {
      case 'products':
        return [];
      case 'articles':
        return this.articleRepository
          .createQueryBuilder('article')
          .select([
            'article.id',
            'article.title',
            'article.view',
            'article.like',
          ])
          .orderBy('article.view', 'DESC')
          .limit(limit)
          .getMany();

      case 'authors':
        return [];

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

    const revenueData = await this.articleRepository
      .createQueryBuilder('article')
      .select([
        `${groupBy} as date`,
        'SUM(article.view) as revenue',
        'COUNT(article.id) as orders',
      ])
      .where('article.createdAt >= :startDate', { startDate })
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
