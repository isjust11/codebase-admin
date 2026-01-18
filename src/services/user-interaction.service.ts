import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { UserInteraction } from '../entities/user-interaction.entity';
import { InteractionStats } from '../entities/interaction-stats.entity';
import { CreateUserInteractionDto, UpdateUserInteractionDto, UserInteractionQueryDto } from '../dtos/user-interaction.dto';
import { InteractionType } from '../enums/interaction-type.enum';
import { InteractionTarget } from '../enums/interaction-target.enum';
import { Article } from '../entities/article.entity';
import { Category } from '../entities/category.entity';
import { Book } from 'src/entities/book.entity';

@Injectable()
export class UserInteractionService {
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
      if (createDto.interactionType === InteractionType.VIEW
        || createDto.interactionType === InteractionType.DOWNLOAD
        || createDto.interactionType === InteractionType.FAVORITE
        || createDto.interactionType === InteractionType.ARCHIVED
      ) {
        await this.updateInteractionStats(createDto.targetType, createDto.targetId, createDto.interactionType, 1);
        return existingInteraction;
      }
      // for reading progress, update the reading progress
      if (createDto.interactionType === InteractionType.READING) {
        existingInteraction.metadata = createDto.metadata;
        await this.userInteractionRepository.save(existingInteraction);
        return existingInteraction;
      }
      throw new ConflictException('Interaction already exists');
    }
    // Create new interaction
    const interaction = this.userInteractionRepository.create({
      userId,
      ...createDto,
    });

    // Set target-specific foreign keys
    this.setTargetForeignKeys(interaction, createDto.targetType, createDto.targetId);

    const savedInteraction = await this.userInteractionRepository.save(interaction);

    // Update statistics
    await this.updateInteractionStats(createDto.targetType, createDto.targetId, createDto.interactionType, 1);

    return savedInteraction;
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
      interaction.metadata = updateDto.metadata;
    }

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
      .where('interaction.userId = :userId', { userId });

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
      .orderBy('interaction.createdAt', 'DESC')
      .getManyAndCount();

    return {
      data: interactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
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
  ): Promise<{ [key in InteractionType]?: boolean }> {
    const interactions = await this.userInteractionRepository.find({
      where: {
        userId,
        targetType: targetType.toString(),
        targetId,
      },
    });

    const status: { [key in InteractionType]?: boolean } = {};
    interactions.forEach((interaction) => {
      status[interaction.interactionType as InteractionType] = true;
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
        case InteractionType.RATE:
          stats.rateCount += increment;
          // Note: For rating, you might want to recalculate average rating
          break;
        case InteractionType.FOLLOW:
          stats.followCount += increment;
        case InteractionType.FAVORITE:
          stats.favoriteStatus = !stats.favoriteStatus;
          break;
        case InteractionType.ARCHIVED:
          stats.archiveStatus = !stats.archiveStatus;
          break;
      }

      await manager.save(stats);
    });
  }
}
