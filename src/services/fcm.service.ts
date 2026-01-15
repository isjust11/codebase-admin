import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from './firebase.service';

type SendPayload = {
  title: string;
  body: string;
  type: string;
  data?: Record<string, string>;
};

@Injectable()
export class FcmService {
  private readonly logger = new Logger(FcmService.name);

  constructor(private readonly firebase: FirebaseService) {}

  async sendToToken(token: string, payload: SendPayload) {
    const messaging = this.firebase.messaging;
    if (!messaging) {
      this.logger.warn('FCM messaging not initialized. Skipping sendToToken');
      return null;
    }
    const message = {
      token,
      notification: { title: payload.title, body: payload.body },
      data: payload.data ?? {},
      android: {
        priority: 'high' as const,
        notification: {
          channelId: 'readbox_channel',
          sound: 'default',
          priority: 'high' as const,
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    } as const;
    return await messaging.send(message);
  }

  async sendToTokens(tokens: string[], payload: SendPayload) {
    const messaging = this.firebase.messaging;
    if (!messaging) {
      this.logger.warn('FCM messaging not initialized. Skipping sendToTokens');
      return null;
    }
    if (tokens.length === 0) return { successCount: 0, failureCount: 0, responses: [] };
    const message = {
      tokens,
      notification: { title: payload.title, body: payload.body },
      data: payload.data ?? {},
      android: {
        priority: 'high' as const,
        notification: {
          channelId: 'readbox_channel',
          sound: 'default',
          priority: 'high' as const,
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    } as const;
    return await messaging.sendEachForMulticast(message);
  }

  async sendToTopic(topic: string, payload: SendPayload) {
    const messaging = this.firebase.messaging;
    if (!messaging) {
      this.logger.warn('FCM messaging not initialized. Skipping sendToTopic');
      return null;
    }
    const message = {
      topic,
      notification: { title: payload.title, body: payload.body },
      data: payload.data ?? {},
      android: {
        priority: 'high' as const,
        notification: {
          channelId: 'readbox_channel',
          sound: 'default',
          priority: 'high' as const,
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    } as const;
    return await messaging.send(message);
  }

  /**
   * Subscribe multiple FCM tokens to a topic
   * @param tokens Array of FCM tokens to subscribe
   * @param topic Topic name to subscribe to
   */
  async subscribeToTopic(tokens: string[], topic: string) {
    const messaging = this.firebase.messaging;
    if (!messaging) {
      this.logger.warn('FCM messaging not initialized. Skipping subscribeToTopic');
      return { successCount: 0, failureCount: tokens.length, errors: [] };
    }
    
    if (tokens.length === 0) {
      return { successCount: 0, failureCount: 0, errors: [] };
    }

    try {
      const response = await messaging.subscribeToTopic(tokens, topic);
      this.logger.log(`Subscribed ${response.successCount} tokens to topic: ${topic}`);
      
      if (response.failureCount > 0) {
        this.logger.warn(`Failed to subscribe ${response.failureCount} tokens to topic: ${topic}`);
        response.errors.forEach((err, idx) => {
          this.logger.error(`Token ${tokens[idx]}: ${err.error}`);
        });
      }
      
      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
        errors: response.errors,
      };
    } catch (error) {
      this.logger.error(`Error subscribing to topic ${topic}:`, error);
      throw error;
    }
  }

  /**
   * Unsubscribe multiple FCM tokens from a topic
   * @param tokens Array of FCM tokens to unsubscribe
   * @param topic Topic name to unsubscribe from
   */
  async unsubscribeFromTopic(tokens: string[], topic: string) {
    const messaging = this.firebase.messaging;
    if (!messaging) {
      this.logger.warn('FCM messaging not initialized. Skipping unsubscribeFromTopic');
      return { successCount: 0, failureCount: tokens.length, errors: [] };
    }
    
    if (tokens.length === 0) {
      return { successCount: 0, failureCount: 0, errors: [] };
    }

    try {
      const response = await messaging.unsubscribeFromTopic(tokens, topic);
      this.logger.log(`Unsubscribed ${response.successCount} tokens from topic: ${topic}`);
      
      if (response.failureCount > 0) {
        this.logger.warn(`Failed to unsubscribe ${response.failureCount} tokens from topic: ${topic}`);
        response.errors.forEach((err, idx) => {
          this.logger.error(`Token ${tokens[idx]}: ${err.error}`);
        });
      }
      
      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
        errors: response.errors,
      };
    } catch (error) {
      this.logger.error(`Error unsubscribing from topic ${topic}:`, error);
      throw error;
    }
  }
}


