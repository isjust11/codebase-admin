import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Not } from 'typeorm';
import { UserInteraction } from '../entities/user-interaction.entity';
import { InteractionStats } from '../entities/interaction-stats.entity';
import { CreateUserInteractionDto, UpdateUserInteractionDto, UserInteractionQueryDto } from '../dtos/user-interaction.dto';
import { InteractionType } from '../enums/interaction-type.enum';
import { InteractionTarget } from '../enums/interaction-target.enum';
import { Article } from '../entities/article.entity';
import { Category } from '../entities/category.entity';
import { Book } from 'src/entities/book.entity';
import { User } from 'src/entities/user.entity';
import { FcmService } from './fcm.service';
import { FcmTokenService } from './fcm-token.service';
import { NotificationService } from './notification.service';
import { NotificationType } from 'src/enums/notification.enum';
import { InteractionTemplate } from 'src/templates/notification/interaction-template';

/** Các interaction sẽ gửi thông báo tới người đăng ebook */
const NOTIFY_OWNER_TYPES: InteractionType[] = [
  InteractionType.LIKE,
  InteractionType.BOOKMARK,
  InteractionType.FAVORITE,
  InteractionType.SHARE,
  InteractionType.DOWNLOAD,
  InteractionType.RATING,
  InteractionType.FOLLOW,
];

@Injectable()
export class UserInteractionService {
  private readonly logger = new Logger(UserInteractionService.name);

  constructor(
    @InjectRepository(UserInteraction)
    private userInteractionRepository: Repository<UserInteraction>,
    @InjectRepository(InteractionStats)
    private interactionStatsRepository: Repository<InteractionStats>,
    @InjectRepository(Article)
    private articleRepository: Repository<Article>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    private dataSource: DataSource,
    @InjectRepository(Book)
    private bookRepository: Repository<Book>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private fcmService: FcmService,
    private fcmTokenService: FcmTokenService,
    private notificationService: NotificationService,
  ) { }

  async createInteraction(userId: number, createDto: CreateUserInteractionDto): Promise<UserInteraction> {
    // Validate target exists
    await this.validateTarget(createDto.targetType, createDto.targetId);

    // Check if interaction already exists
    const existingInteraction = await this.userInteractionRepository.findOne({
      where: {
        userId,
        targetId: createDto.targetId,
        interactionType: createDto.interactionType,
      },
    });

    if (existingInteraction) {

      // For countable actions, increment the counter on the interaction record
      if (createDto.interactionType === InteractionType.TTS) {
        existingInteraction.ttsCount = (existingInteraction.ttsCount || 0) + 1;
        existingInteraction.updatedAt = new Date();
        await this.userInteractionRepository.save(existingInteraction);
        await this.updateInteractionStats(createDto.targetType, createDto.targetId, createDto.interactionType, 1);
        return existingInteraction;
      }
      if (createDto.interactionType === InteractionType.CONVERT) {
        existingInteraction.convertCount = (existingInteraction.convertCount || 0) + 1;
        existingInteraction.updatedAt = new Date();
        await this.userInteractionRepository.save(existingInteraction);
        await this.updateInteractionStats(createDto.targetType, createDto.targetId, createDto.interactionType, 1);
        return existingInteraction;
      }
      if (createDto.interactionType === InteractionType.DOWNLOAD) {
        existingInteraction.downloadCount = (existingInteraction.downloadCount || 0) + 1;
        existingInteraction.updatedAt = new Date();
        await this.userInteractionRepository.save(existingInteraction);
        await this.updateInteractionStats(createDto.targetType, createDto.targetId, createDto.interactionType, 1);
        return existingInteraction;
      }
      if (createDto.interactionType === InteractionType.READ) {
        existingInteraction.readCount = (existingInteraction.readCount || 0) + 1;
        existingInteraction.updatedAt = new Date();
        await this.userInteractionRepository.save(existingInteraction);
        await this.updateInteractionStats(createDto.targetType, createDto.targetId, createDto.interactionType, 1);
        return existingInteraction;
      }
      if (createDto.interactionType === InteractionType.SHARE) {
        existingInteraction.shareCount = (existingInteraction.shareCount || 0) + 1;
        existingInteraction.sharePlatform = createDto.sharePlatform;
        existingInteraction.updatedAt = new Date();
        await this.userInteractionRepository.save(existingInteraction);
        await this.updateInteractionStats(createDto.targetType, createDto.targetId, createDto.interactionType, 1);
        return existingInteraction;
      }

      // for reading progress, update the reading progress
      if (createDto.interactionType === InteractionType.READING) {
        existingInteraction.metadata = createDto.metadata ? JSON.stringify(createDto.metadata) : null;
        existingInteraction.updatedAt = new Date();
        existingInteraction.status = 1;
        const processReading = createDto.metadata?.progress;
        if (processReading && processReading >= 1) {
          existingInteraction.status = 2;
        }
        await this.userInteractionRepository.save(existingInteraction);
      } else if (createDto.interactionType === InteractionType.RATING) {
        existingInteraction.rating = createDto.rating;
        existingInteraction.comment = createDto.comment;
        existingInteraction.updatedAt = new Date();
        await this.userInteractionRepository.save(existingInteraction);
        if (createDto.comment) {
          this.sendInteractionNotification(userId, createDto, false).catch(() => {});
        }
      } else {
        existingInteraction.updatedAt = new Date();
        existingInteraction.status = existingInteraction.status === 1 ? 0 : 1;
        await this.userInteractionRepository.save(existingInteraction);
      }
      const valueIncrement = existingInteraction.status === 1 ? 1 : -1;
      await this.updateInteractionStats(createDto.targetType, createDto.targetId, createDto.interactionType, valueIncrement);

      return existingInteraction;
    }
    // Create new interaction
    const interaction = this.userInteractionRepository.create({
      userId,
      ...createDto,
      ttsCount: createDto.interactionType === InteractionType.TTS ? 1 : 0,
      convertCount: createDto.interactionType === InteractionType.CONVERT ? 1 : 0,
      downloadCount: createDto.interactionType === InteractionType.DOWNLOAD ? 1 : 0,
      readCount: createDto.interactionType === InteractionType.READ ? 1 : 0,
      shareCount: createDto.interactionType === InteractionType.SHARE ? 1 : 0,
      metadata: createDto.metadata ? JSON.stringify(createDto.metadata) : null,
      status: 1,
    });

    this.setTargetForeignKeys(interaction, createDto.targetType, createDto.targetId);

    const savedInteraction = await this.userInteractionRepository.save(interaction);

    await this.updateInteractionStats(createDto.targetType, createDto.targetId, createDto.interactionType, 1);

    this.sendInteractionNotification(userId, createDto, true).catch(() => {});

    return savedInteraction;
  }

  async loadInteraction(targetType: InteractionTarget, targetId: number, query: UserInteractionQueryDto) {
    const queryBuilder = this.userInteractionRepository
      .createQueryBuilder('interaction')
      .where('interaction.targetType = :targetType', { targetType: targetType.toString() })
      .andWhere('interaction.targetId = :targetId', { targetId: targetId });
    if (query.interactionType) {
      queryBuilder.andWhere('interaction.interactionType = :interactionType', { interactionType: query.interactionType });
    }
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;
    queryBuilder
      .leftJoinAndSelect('interaction.book', 'book')
      .leftJoinAndSelect('interaction.user', 'user');
    const [interactions, total] = await queryBuilder.skip(skip)
      .take(limit).orderBy('interaction.updatedAt', 'DESC').getManyAndCount();
    return {
      data: interactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getInteractionAction(targetType: InteractionTarget, actionType: InteractionType, targetId: number, userId: number) {
    const interaction = await this.userInteractionRepository.findOne({
      where: { targetType: targetType.toString(), interactionType: actionType, targetId: targetId, userId: userId },
    });
    if (!interaction) {
      return null;
    }
    return interaction;
  }

  async updateInteraction(
    userId: number,
    targetType: InteractionTarget,
    targetId: number,
    interactionType: InteractionType,
    updateDto: UpdateUserInteractionDto,
  ): Promise<UserInteraction> {
    const interaction = await this.userInteractionRepository.findOne({
      where: {
        userId,
        targetType: targetType.toString(),
        targetId,
        interactionType: interactionType,
      },
    });

    if (!interaction) {
      throw new NotFoundException('Interaction not found');
    }

    // Update fields
    if (updateDto.rating !== undefined) {
      interaction.rating = updateDto.rating;
    }
    if (updateDto.comment !== undefined) {
      interaction.comment = updateDto.comment;
    }
    if (updateDto.sharePlatform !== undefined) {
      interaction.sharePlatform = updateDto.sharePlatform;
    }
    if (updateDto.metadata !== undefined) {
      interaction.metadata = updateDto.metadata ? JSON.stringify(updateDto.metadata) : null;
    }
    interaction.updatedAt = new Date();
    return await this.userInteractionRepository.save(interaction);
  }

  async removeInteraction(
    userId: number,
    targetType: InteractionTarget,
    targetId: number,
    interactionType: InteractionType,
  ): Promise<void> {
    const interaction = await this.userInteractionRepository.findOne({
      where: {
        userId,
        targetType: targetType.toString(),
        targetId,
        interactionType,
      },
    });

    if (!interaction) {
      throw new NotFoundException('Interaction not found');
    }

    await this.userInteractionRepository.remove(interaction);

    // Update statistics
    await this.updateInteractionStats(targetType, targetId, interactionType, -1);
  }

  async getUserInteractions(userId: number, query: UserInteractionQueryDto) {
    const queryBuilder = this.userInteractionRepository
      .createQueryBuilder('interaction')
      .where('interaction.userId = :userId', { userId })
      .andWhere('interaction.status = 1');

    if (query.interactionType) {
      queryBuilder.andWhere('interaction.interactionType = :interactionType', {
        interactionType: query.interactionType,
      });
    }

    if (query.targetType) {
      queryBuilder.andWhere('interaction.targetType = :targetType', {
        targetType: query.targetType,
      });
    }

    if (query.targetId) {
      queryBuilder.andWhere('interaction.targetId = :targetId', {
        targetId: query.targetId,
      });
    }

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const [interactions, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('interaction.updatedAt', 'DESC')
      .leftJoinAndSelect('interaction.book', 'book')
      .getManyAndCount();

    return {
      data: interactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getMyInteractionCounts(userId: number): Promise<{ [key: string]: number }> {
    const results = await this.userInteractionRepository
      .createQueryBuilder('interaction')
      .select('interaction.interactionType', 'interactionType')
      .addSelect('COUNT(*)', 'count')
      .where('interaction.userId = :userId', { userId })
      .andWhere('interaction.status = 1')
      .groupBy('interaction.interactionType')
      .getRawMany();

    const counts: { [key: string]: number } = {};
    for (const r of results) {
      counts[r.interactionType] = parseInt(r.count, 10);
    }
    return counts;
  }

  async getInteractionStats(targetType: InteractionTarget, targetId: number) {
    let stats = await this.interactionStatsRepository.findOne({
      where: { targetType, targetId },
    });

    if (!stats) {
      // Create new stats record
      stats = this.interactionStatsRepository.create({
        targetType,
        targetId,
      });
      await this.interactionStatsRepository.save(stats);
    }

    return stats;
  }

  async getUserInteractionStatus(
    userId: number,
    targetType: InteractionTarget,
    targetId: number,
  ): Promise<{ [key in InteractionType]?: any }> {
    const interactions = await this.userInteractionRepository.find({
      where: {
        userId,
        targetType: targetType.toString(),
        targetId,
      },
    });

    const status: { [key in InteractionType]?: any } = {};
    interactions.forEach((interaction) => {
      if (interaction.interactionType === InteractionType.READING) {
        status[interaction.interactionType as InteractionType] = interaction.metadata ? JSON.parse(interaction.metadata) : null;
      } else {
        status[interaction.interactionType as InteractionType] = true;
      }
    });

    return status;
  }

  private async validateTarget(targetType: InteractionTarget, targetId: number): Promise<void> {
    let exists = false;

    switch (targetType) {
      case InteractionTarget.ARTICLE:
        exists = await this.articleRepository.findOne({ where: { id: targetId } }) !== null;
        break;
      case InteractionTarget.BOOK:
        exists = await this.bookRepository.findOne({ where: { id: targetId } }) !== null;
        break;
      default:
        throw new Error(`Unsupported target type: ${targetType}`);
    }

    if (!exists) {
      throw new NotFoundException(`Target ${targetType} with id ${targetId} not found`);
    }
  }

  private setTargetForeignKeys(
    interaction: UserInteraction,
    targetType: InteractionTarget,
    targetId: number,
  ): void {
    switch (targetType) {
      case InteractionTarget.BOOK:
        interaction.bookId = targetId;
        break;
    }
  }

  private async updateInteractionStats(
    targetType: InteractionTarget,
    targetId: number,
    interactionType: InteractionType,
    increment: number,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      let stats = await manager.findOne(InteractionStats, {
        where: { targetType: targetType, targetId },
      });

      if (!stats) {
        stats = manager.create(InteractionStats, {
          targetType,
          targetId,
        });
        await manager.save(stats);
      }

      // Update specific counter based on interaction type
      switch (interactionType) {
        case InteractionType.LIKE:
          stats.likeCount += increment;
          break;
        case InteractionType.DISLIKE:
          stats.dislikeCount += increment;
          break;
        case InteractionType.BOOKMARK:
          stats.bookmarkCount += increment;
          break;
        case InteractionType.SHARE:
          stats.shareCount += increment;
          break;
        case InteractionType.VIEW:
          stats.viewCount += increment;
          break;
        case InteractionType.COMMENT:
          stats.commentCount += increment;
          break;
        case InteractionType.RATING:
          const { totalRating, averageRating } = await this.calculateAverageRating(targetId);
          stats.totalRating = totalRating;
          stats.averageRating = averageRating;
          stats.rateCount += increment;
          stats.commentCount += increment;
          break;
        case InteractionType.FOLLOW:
          stats.followCount += increment;
        case InteractionType.FAVORITE:
          stats.favoriteCount += increment;
          break;
        case InteractionType.ARCHIVED:
          stats.archiveCount += increment;
          break;
        case InteractionType.TTS:
          stats.ttsCount += increment;
          break;
        case InteractionType.CONVERT:
          stats.convertCount += increment;
          break;
        case InteractionType.DOWNLOAD:
          stats.downloadCount += increment;
          break;
        case InteractionType.READ:
          stats.readCount += increment;
          break;
      }

      await manager.save(stats);
    });
  }
  private async calculateAverageRating(targetId: number): Promise<{ totalRating: number, averageRating: number }> {
    const totalRating = await this.userInteractionRepository.count({
      where: {
        targetId: targetId,
        interactionType: InteractionType.RATING,
      },
    });
    const averageRatingResult = await this.userInteractionRepository.createQueryBuilder('UserInteraction')
      .select('AVG(UserInteraction.rating)', 'avg')
      .where('UserInteraction.targetId = :targetId', { targetId: targetId })
      .andWhere('UserInteraction.interactionType = :interactionType', { interactionType: InteractionType.RATING })
      .getRawOne();
    const averageRating = averageRatingResult ? parseFloat(averageRatingResult.avg) : 0;
    return { totalRating, averageRating };
  }

  /**
   * Gửi thông báo tới người đăng ebook khi có interaction mới.
   * Với RATING có comment → thêm thông báo tới những người đã bình luận trước đó.
   */
  async sendInteractionNotification(
    actorUserId: number,
    dto: CreateUserInteractionDto,
    isNewInteraction: boolean,
  ): Promise<void> {
    try {
      if (dto.targetType !== InteractionTarget.BOOK) return;
      if (!NOTIFY_OWNER_TYPES.includes(dto.interactionType)) return;

      const book = await this.bookRepository.findOne({
        where: { id: dto.targetId },
        relations: ['createBy'],
      });
      if (!book) return;

      const actor = await this.userRepository.findOne({ where: { id: actorUserId } });
      const actorName = actor?.fullName || actor?.username || 'Người dùng';

      const ownerUserId = book.createById;

      if (ownerUserId && ownerUserId !== actorUserId) {
        const notification = InteractionTemplate.forBookOwner(
          dto.interactionType,
          actorName,
          book.title,
          book.id,
          { rating: dto.rating, comment: dto.comment },
        );

        if (notification) {
          const ownerToken = await this.fcmTokenService.findByUserId(ownerUserId);
          if (ownerToken) {
            await this.fcmService.sendToToken(ownerToken.token, {
              title: notification.title,
              body: notification.body,
              type: 'interaction',
              data: notification.data,
            });
          }

          await this.notificationService.newNotification(
            NotificationType.INTERACTION,
            notification.data,
            notification.title,
            notification.body,
            ownerUserId,
          );
        }
      }

      if (dto.interactionType === InteractionType.RATING && dto.comment) {
        await this.notifyOtherReviewers(actorUserId, book, actorName, dto.comment);
      }
    } catch (err) {
      this.logger.warn(`[sendInteractionNotification] Failed: ${err?.message}`);
    }
  }

  /**
   * Gửi thông báo tới những người đã bình luận/đánh giá trước đó khi có bình luận mới.
   */
  private async notifyOtherReviewers(
    actorUserId: number,
    book: Book,
    actorName: string,
    comment: string,
  ): Promise<void> {
    const otherReviewers = await this.userInteractionRepository
      .createQueryBuilder('i')
      .select('DISTINCT i.userId', 'userId')
      .where('i.targetId = :targetId', { targetId: book.id })
      .andWhere('i.targetType = :targetType', { targetType: InteractionTarget.BOOK })
      .andWhere('i.interactionType = :interactionType', { interactionType: InteractionType.RATING })
      .andWhere('i.userId != :actorId', { actorId: actorUserId })
      .andWhere('i.comment IS NOT NULL')
      .getRawMany();

    if (otherReviewers.length === 0) return;

    const notification = InteractionTemplate.newCommentForOtherReviewers(
      actorName,
      book.title,
      book.id,
      comment,
    );

    const reviewerIds: number[] = otherReviewers
      .map((r) => Number(r.userId))
      .filter((id) => id !== book.createById);

    for (const reviewerId of reviewerIds) {
      try {
        const token = await this.fcmTokenService.findByUserId(reviewerId);
        if (token) {
          await this.fcmService.sendToToken(token.token, {
            title: notification.title,
            body: notification.body,
            type: 'interaction',
            data: notification.data,
          });
        }

        await this.notificationService.newNotification(
          NotificationType.INTERACTION,
          notification.data,
          notification.title,
          notification.body,
          reviewerId,
        );
      } catch (err) {
        this.logger.warn(`[notifyOtherReviewers] userId=${reviewerId} failed: ${err?.message}`);
      }
    }
  }
}
