import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TopicSubscription } from '../entities/topic-subscription.entity';

@Injectable()
export class TopicSubscriptionService {
  constructor(
    @InjectRepository(TopicSubscription)
    private readonly subscriptionRepo: Repository<TopicSubscription>,
  ) {}

  /**
   * Subscribe a user to a topic
   */
  async subscribe(userId: number, topic: string) {
    const existing = await this.subscriptionRepo.findOne({
      where: { userId, topic },
    });

    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        return this.subscriptionRepo.save(existing);
      }
      return existing;
    }

    const subscription = this.subscriptionRepo.create({
      userId,
      topic,
      isActive: true,
    });

    return this.subscriptionRepo.save(subscription);
  }

  /**
   * Unsubscribe a user from a topic
   */
  async unsubscribe(userId: number, topic: string) {
    await this.subscriptionRepo.update(
      { userId, topic },
      { isActive: false },
    );
  }

  /**
   * Get all user IDs subscribed to a topic
   * This is used to create individual notifications when sending to topics
   */
  async getUserIdsByTopic(topic: string): Promise<number[]> {
    const subscriptions = await this.subscriptionRepo.find({
      where: { topic, isActive: true },
      select: ['userId'],
    });

    return subscriptions.map(sub => sub.userId);
  }

  /**
   * Get all topics a user is subscribed to
   */
  async getTopicsByUserId(userId: number): Promise<string[]> {
    const subscriptions = await this.subscriptionRepo.find({
      where: { userId, isActive: true },
      select: ['topic'],
    });

    return subscriptions.map(sub => sub.topic);
  }

  /**
   * Check if a user is subscribed to a topic
   */
  async isSubscribed(userId: number, topic: string): Promise<boolean> {
    const subscription = await this.subscriptionRepo.findOne({
      where: { userId, topic, isActive: true },
    });

    return !!subscription;
  }

  /**
   * Get subscription statistics for a topic
   */
  async getTopicStats(topic: string) {
    const total = await this.subscriptionRepo.count({
      where: { topic },
    });

    const active = await this.subscriptionRepo.count({
      where: { topic, isActive: true },
    });

    return {
      topic,
      totalSubscriptions: total,
      activeSubscriptions: active,
      inactiveSubscriptions: total - active,
    };
  }
}

