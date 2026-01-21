import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { FcmToken } from '../entities/fcm-token.entity';
import { FcmTokenDto } from '../dtos/fcm-token.dto';
import { FcmService } from './fcm.service';
import { TopicSubscriptionService } from './topic-subscription.service';

@Injectable()
export class FcmTokenService {
  constructor(
    @InjectRepository(FcmToken)
    private readonly fcmRepo: Repository<FcmToken>,
    @Inject(forwardRef(() => FcmService))
    private readonly fcmService: FcmService,
    @Inject(forwardRef(() => TopicSubscriptionService))
    private readonly topicSubscriptionService: TopicSubscriptionService,
  ) {}

  async findPagination(page = 1, size = 10, search = '') {
    const [items, total] = await this.fcmRepo.findAndCount({
      where: search ? [{ token: Like(`%${search}%`) }, { deviceId: Like(`%${search}%`) }] : {},
      order: { createdAt: 'DESC' },
      skip: (page - 1) * size,
      take: size,
    });
    return { items, total, page, size };
  }

  async registerOrUpdate(data: FcmTokenDto, userId: number) {
    const existing = await this.fcmRepo.findOne({ where: { token: data.token, platform: data.platform, deviceId: data.deviceId } });
    if (existing) {
      existing.deviceId = data.deviceId ?? existing.deviceId ?? '';
      existing.userId = userId;
      existing.isActive = true;
      existing.updatedAt = new Date();
      return this.fcmRepo.save(existing);
    }
    const entity = this.fcmRepo.create({
      token: data.token,
      platform: data.platform,
      deviceId: data.deviceId ?? '',
      userId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    });
    return this.fcmRepo.save(entity);
  }

  findById(id: number) {
    return this.fcmRepo.findOne({ where: { id } });
  }

  async findByUserId(userId: number) {
    return this.fcmRepo.findOne({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  registerMany(tokens: FcmTokenDto[], userId: number) {
    return Promise.all(tokens.map((token) => this.registerOrUpdate(token, userId)));
  }

  async deactivate(id: number) {
    await this.fcmRepo.update(id, { isActive: false });
  }

  async remove(id: number) {
    await this.fcmRepo.delete(id);
  }
  /**
   * Subscribe all active FCM tokens to a topic
   * @param topic Topic name to subscribe to
   * @param userId Optional: Subscribe only tokens of a specific user
   */
  async subscribeTopic(topic: string, userId?: number) {
    // Get active FCM tokens from database
    const where: any = { isActive: true };
    if (userId) {
      where.userId = userId;
    }
    
    const tokens = await this.fcmRepo.find({ where });
    
    if (tokens.length === 0) {
      return { 
        successCount: 0, 
        failureCount: 0, 
        message: 'No active tokens found to subscribe',
        errors: [] 
      };
    }

    // Extract token strings
    const tokenStrings = tokens.map(t => t.token);

    // Subscribe to topic using Firebase Admin SDK
    const result = await this.fcmService.subscribeToTopic(tokenStrings, topic);
    
    // Track subscriptions in database for each user
    if (result.successCount > 0) {
      // Get unique user IDs from successfully subscribed tokens
      const uniqueUserIds = [...new Set(tokens.map(t => t.userId).filter(id => id != null))];
      
      // Create subscription records
      await Promise.all(
        uniqueUserIds.map(uid => 
          this.topicSubscriptionService.subscribe(uid, topic)
        )
      );
    }
    
    return {
      ...result,
      totalTokens: tokens.length,
      message: `Subscribed ${result.successCount}/${tokens.length} tokens to topic: ${topic}`,
    };
  }

  /**
   * Unsubscribe all active FCM tokens from a topic
   * @param topic Topic name to unsubscribe from
   * @param userId Optional: Unsubscribe only tokens of a specific user
   */
  async unsubscribeTopic(topic: string, userId?: number) {
    // Get active FCM tokens from database
    const where: any = { isActive: true };
    if (userId) {
      where.userId = userId;
    }
    
    const tokens = await this.fcmRepo.find({ where });
    
    if (tokens.length === 0) {
      return { 
        successCount: 0, 
        failureCount: 0, 
        message: 'No active tokens found to unsubscribe',
        errors: [] 
      };
    }

    // Extract token strings
    const tokenStrings = tokens.map(t => t.token);

    // Unsubscribe from topic using Firebase Admin SDK
    const result = await this.fcmService.unsubscribeFromTopic(tokenStrings, topic);
    
    // Remove subscription records from database
    if (result.successCount > 0) {
      // Get unique user IDs from successfully unsubscribed tokens
      const uniqueUserIds = [...new Set(tokens.map(t => t.userId).filter(id => id != null))];
      
      // Remove subscription records
      await Promise.all(
        uniqueUserIds.map(uid => 
          this.topicSubscriptionService.unsubscribe(uid, topic)
        )
      );
    }
    
    return {
      ...result,
      totalTokens: tokens.length,
      message: `Unsubscribed ${result.successCount}/${tokens.length} tokens from topic: ${topic}`,
    };
  }

  /**
   * Subscribe specific tokens to a topic
   * @param tokens Array of token strings
   * @param topic Topic name
   */
  async subscribeTokensToTopic(tokens: string[], topic: string) {
    return await this.fcmService.subscribeToTopic(tokens, topic);
  }

  /**
   * Unsubscribe specific tokens from a topic
   * @param tokens Array of token strings
   * @param topic Topic name
   */
  async unsubscribeTokensFromTopic(tokens: string[], topic: string) {
    return await this.fcmService.unsubscribeFromTopic(tokens, topic);
  }
}



