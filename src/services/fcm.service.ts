import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from './firebase.service';

type SendPayload = {
  title: string;
  body: string;
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
    } as const;
    return await messaging.send(message);
  }
}


