import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService {
  private readonly logger = new Logger(FirebaseService.name);
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (this.initialized || admin.apps.length > 0) {
      this.initialized = true;
      return;
    }
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      this.logger.warn('Firebase credentials are not fully configured. FCM will be disabled.');
      return;
    }

    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      this.initialized = true;
      this.logger.log('Firebase Admin initialized for FCM messaging');
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin', error as Error);
      this.initialized = false;
    }
  }

  get messaging(): admin.messaging.Messaging | null {
    if (!this.initialized) return null;
    return admin.messaging();
  }
}


