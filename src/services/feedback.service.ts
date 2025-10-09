import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Like, Repository, Between } from 'typeorm';
import { Feedback, FeedbackStatus, FeedbackType, FeedbackPriority } from '../entities/feedback.entity';
import { CreateFeedbackDto } from '../dtos/create-feedback.dto';
import { UpdateFeedbackDto } from '../dtos/update-feedback.dto';
import { PaginatedResponse, PaginationParams } from '../dtos/filter.dto';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(Feedback)
    private feedbackRepository: Repository<Feedback>,
  ) {}

  async findPagination(params: PaginationParams & {
    status?: FeedbackStatus;
    type?: FeedbackType;
    priority?: FeedbackPriority;
    assignedToId?: number;
    userId?: number;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const { 
      page = 1, 
      size = 10, 
      search = '', 
      status, 
      type, 
      priority, 
      assignedToId,
      userId,
      dateFrom,
      dateTo
    } = params;
    
    const skip = (page - 1) * size;
    
    // Build where conditions
    const whereConditions: any = {};
    
    if (search) {
      whereConditions.title = Like(`%${search}%`);
    }
    
    if (status) {
      whereConditions.status = status;
    }
    
    if (type) {
      whereConditions.type = type;
    }
    
    if (priority) {
      whereConditions.priority = priority;
    }
    
    if (assignedToId) {
      whereConditions.assignedToId = assignedToId;
    }
    
    if (userId) {
      whereConditions.userId = userId;
    }
    
    if (dateFrom && dateTo) {
      whereConditions.createdAt = Between(new Date(dateFrom), new Date(dateTo));
    }

    const [data, total] = await this.feedbackRepository.findAndCount({
      where: whereConditions,
      skip,
      take: size,
      relations: ['user', 'assignedTo'],
      order: { createdAt: 'DESC' },
    });

    return {
      data,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  async create(createFeedbackDto: CreateFeedbackDto): Promise<Feedback> {
    // Create feedback entity from DTO
    const feedbackData: DeepPartial<Feedback> = {
      ...createFeedbackDto,
      attachments: createFeedbackDto.attachments ? createFeedbackDto.attachments.join(',') : '',
      user: createFeedbackDto.userId ? { id: createFeedbackDto.userId } : undefined,
    };
    
    const feedback = this.feedbackRepository.create(feedbackData);
    return await this.feedbackRepository.save(feedback);
  }

  async findAll(): Promise<Feedback[]> {
    return await this.feedbackRepository.find({
      relations: ['user', 'assignedTo'],
      order: { createdAt: 'DESC' },
    });
  }

  async findPublic(): Promise<Feedback[]> {
    return await this.feedbackRepository.find({
      where: { isPublic: true },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Feedback> {
    const feedback = await this.feedbackRepository.findOne({ 
      where: { id },
      relations: ['user', 'assignedTo'],
    });
    if (!feedback) {
      throw new NotFoundException('Feedback not found');
    }
    return feedback;
  }

  async update(id: number, updateFeedbackDto: UpdateFeedbackDto): Promise<Feedback> {
    const feedback = await this.findOne(id);

    // Handle status change to resolved
    if (updateFeedbackDto.status === FeedbackStatus.RESOLVED && feedback.status !== FeedbackStatus.RESOLVED) {
      updateFeedbackDto.resolvedAt = new Date();
    }

    // Update attachments if provided
    if (updateFeedbackDto.attachments) {
      updateFeedbackDto.attachments = updateFeedbackDto.attachments;
    }

    // Handle assigned user
    if (updateFeedbackDto.assignedToId) {
      updateFeedbackDto.assignedToId = updateFeedbackDto.assignedToId;
    }

    Object.assign(feedback, updateFeedbackDto);
    return await this.feedbackRepository.save(feedback);
  }

  async remove(id: number): Promise<void> {
    const feedback = await this.findOne(id);
    await this.feedbackRepository.remove(feedback);
  }

  async updateStatus(id: number, status: FeedbackStatus): Promise<Feedback> {
    const feedback = await this.findOne(id);
    feedback.status = status;
    
    if (status === FeedbackStatus.RESOLVED) {
      feedback.resolvedAt = new Date();
    }
    
    return await this.feedbackRepository.save(feedback);
  }

  async assignToUser(id: number, assignedToId: number): Promise<Feedback> {
    const feedback = await this.findOne(id);
    feedback.assignedToId = assignedToId;
    return await this.feedbackRepository.save(feedback);
  }

  async getStats() {
    const total = await this.feedbackRepository.count();
    const pending = await this.feedbackRepository.count({ where: { status: FeedbackStatus.PENDING } });
    const inProgress = await this.feedbackRepository.count({ where: { status: FeedbackStatus.IN_PROGRESS } });
    const resolved = await this.feedbackRepository.count({ where: { status: FeedbackStatus.RESOLVED } });
    const closed = await this.feedbackRepository.count({ where: { status: FeedbackStatus.CLOSED } });

    const byType = await this.feedbackRepository
      .createQueryBuilder('feedback')
      .select('feedback.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('feedback.type')
      .getRawMany();

    const byPriority = await this.feedbackRepository
      .createQueryBuilder('feedback')
      .select('feedback.priority', 'priority')
      .addSelect('COUNT(*)', 'count')
      .groupBy('feedback.priority')
      .getRawMany();

    return {
      total,
      byStatus: {
        pending,
        inProgress,
        resolved,
        closed
      },
      byType,
      byPriority
    };
  }

  async getRecentFeedback(limit: number = 10): Promise<Feedback[]> {
    return await this.feedbackRepository.find({
      relations: ['user', 'assignedTo'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
