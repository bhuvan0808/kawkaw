import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { FirebaseConfig } from '../common/config/configuration';

/**
 * Wraps the Firebase Admin SDK for:
 *  - verifying client-provided phone-auth ID tokens (AuthN), and
 *  - sending FCM push notifications.
 *
 * If admin credentials are absent (local dev), the service initializes lazily
 * and surfaces a clear error when a live operation is attempted.
 */
@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private app: admin.app.App | null = null;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const fb = this.config.get<FirebaseConfig>('firebase');
    if (!fb?.clientEmail || !fb?.privateKey) {
      this.logger.warn(
        'Firebase admin credentials not set — token verification and FCM are disabled until configured.',
      );
      return;
    }
    if (admin.apps.length > 0) {
      this.app = admin.app();
      return;
    }
    this.app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: fb.projectId,
        clientEmail: fb.clientEmail,
        privateKey: fb.privateKey,
      }),
    });
    this.logger.log(`Firebase Admin initialized for project ${fb.projectId}`);
  }

  private requireApp(): admin.app.App {
    if (!this.app) {
      throw new InternalServerErrorException(
        'Firebase is not configured on the server. Set FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY.',
      );
    }
    return this.app;
  }

  /** Verifies a Firebase ID token and returns the decoded claims. */
  async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    const app = this.requireApp();
    try {
      return await app.auth().verifyIdToken(idToken, true);
    } catch (err) {
      this.logger.warn(`Firebase token verification failed: ${(err as Error).message}`);
      throw new UnauthorizedException('Invalid or expired Firebase token');
    }
  }

  /** Sends a single FCM data+notification message. Returns the message id, or null on soft failure. */
  async sendPush(
    token: string,
    notification: { title: string; body: string },
    data?: Record<string, string>,
  ): Promise<string | null> {
    const app = this.requireApp();
    try {
      return await app.messaging().send({
        token,
        notification,
        data,
        android: { priority: 'high' },
      });
    } catch (err) {
      this.logger.warn(`FCM send failed: ${(err as Error).message}`);
      return null;
    }
  }

  isConfigured(): boolean {
    return this.app !== null;
  }
}
