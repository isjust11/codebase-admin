import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { UserInteraction } from '../entities/user-interaction.entity';
import { InteractionStats } from '../entities/interaction-stats.entity';
import { CreateUserInteractionDto, UpdateUserInteractionDto, UserInteractionQueryDto } from '../dtos/user-interaction.dto';
import { InteractionType } from '../enums/interaction-type.enum';
import { InteractionTarget } from '../enums/interaction-target.enum';
import { Article } from '../entities/article.entity';
import { Herbal } from '../entities/herbal.entity';
import { FolkMedicine } from '../entities/folk-medicine.entity';
import { Author } from '../entities/author.entity';
import { Category } from '../entities/category.entity';

@Injectable()
export class UserInteractionService {
  constructor(
    @InjectRepository(UserInteraction)
    private userInteractionRepository: Repository<UserInteraction>,
    @InjectRepository(InteractionStats)
    private interactionStatsRepository: Repository<InteractionStats>,
    @InjectRepository(Article)
    private articleRepository: Repository<Article>,
    @InjectRepository(Herbal)
    private herbalRepository: Repository<Herbal>,
    @InjectRepository(FolkMedicine)
    private folkMedicineRepository: Repository<FolkMedicine>,
    @InjectRepository(Author)
    private authorRepository: Repository<Author>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    private dataSource: DataSource,
  ) {}

  async createInteraction(userId: number, createDto: CreateUserInteractionDto): Promise<UserInteraction> {
    // Validate target exists
    await this.validateTarget(createDto.targetType, createDto.targetId);

    // Check if interaction already exists
    const existingInteraction = await this.userInteractionRepository.findOne({
      where: {
        userId,
        targetType: createDto.targetType,
        targetId: createDto.targetId,
        interactionType: createDto.interactionType,
      },
    });

    if (existingInteraction) {
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
        targetType,
        targetId,
        interactionType,
      },
    });

    if (!interaction) {
      throw new NotFoundException('Interaction not found');
    }

    Object.assign(interaction, updateDto);
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
        targetType,
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
        targetType,
        targetId,
      },
    });

    const status: { [key in InteractionType]?: boolean } = {};
    interactions.forEach((interaction) => {
      status[interaction.interactionType] = true;
    });

    return status;
  }

  private async validateTarget(targetType: InteractionTarget, targetId: number): Promise<void> {
    let exists = false;

    switch (targetType) {
      case InteractionTarget.ARTICLE:
        exists = await this.articleRepository.findOne({ where: { id: targetId } }) !== null;
        break;
      case InteractionTarget.HERBAL:
        exists = await this.herbalRepository.findOne({ where: { id: targetId } }) !== null;
        break;
      case InteractionTarget.FOLK_MEDICINE:
        exists = await this.folkMedicineRepository.findOne({ where: { id: targetId } }) !== null;
        break;
      case InteractionTarget.AUTHOR:
        exists = await this.authorRepository.findOne({ where: { id: targetId } }) !== null;
        break;
      case InteractionTarget.CATEGORY:
        exists = await this.categoryRepository.findOne({ where: { id: targetId } }) !== null;
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
      case InteractionTarget.ARTICLE:
        interaction.articleId = targetId;
        break;
      case InteractionTarget.HERBAL:
        interaction.herbalId = targetId;
        break;
      case InteractionTarget.FOLK_MEDICINE:
        interaction.folkMedicineId = targetId;
        break;
      case InteractionTarget.AUTHOR:
        interaction.authorId = targetId;
        break;
      case InteractionTarget.CATEGORY:
        interaction.categoryId = targetId;
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
        where: { targetType, targetId },
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
          break;
      }

      await manager.save(stats);
    });
  }
}
