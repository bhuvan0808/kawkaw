import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { User } from '@prisma/client';
import { UserRole } from '../../common/enums';
import { FirebaseService } from '../../firebase/firebase.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { FirebaseLoginDto } from './dto/auth.dto';
import { IssuedTokens, TokenService } from './token.service';

interface RequestMeta {
  userAgent?: string;
  ipAddress?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly firebase: FirebaseService,
    private readonly tokens: TokenService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Exchanges a verified Firebase phone-auth ID token for Kaw Kaw JWTs.
   * Upserts the user keyed on phone number; first login creates a CUSTOMER.
   */
  async loginWithFirebase(
    dto: FirebaseLoginDto,
    meta: RequestMeta,
  ): Promise<{ user: PublicUser; tokens: IssuedTokens }> {
    const decoded = await this.firebase.verifyIdToken(dto.idToken);
    const phone = decoded.phone_number;
    if (!phone) {
      throw new UnauthorizedException('Firebase token does not contain a phone number');
    }

    const user = await this.prisma.user.upsert({
      where: { phone },
      create: {
        phone,
        firebaseUid: decoded.uid,
        name: dto.name,
        email: dto.email,
        fcmToken: dto.fcmToken,
        role: UserRole.CUSTOMER,
        lastLoginAt: new Date(),
      },
      update: {
        firebaseUid: decoded.uid,
        fcmToken: dto.fcmToken ?? undefined,
        name: dto.name ?? undefined,
        lastLoginAt: new Date(),
        deletedAt: null,
      },
    });

    if (!user.isActive) {
      throw new UnauthorizedException('This account has been deactivated');
    }

    const tokens = await this.tokens.issueTokens(user, meta);
    await this.audit.record({
      actorId: user.id,
      action: 'AUTH_LOGIN',
      entityType: 'User',
      entityId: user.id,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return { user: toPublicUser(user), tokens };
  }

  async refresh(refreshToken: string, meta: RequestMeta): Promise<IssuedTokens> {
    return this.tokens.rotateRefreshToken(refreshToken, meta);
  }

  async logout(refreshToken: string): Promise<void> {
    // Best-effort: decode jti and revoke. Invalid tokens are a no-op.
    try {
      const payload = this.decodeJti(refreshToken);
      if (payload) await this.tokens.revoke(payload);
    } catch {
      // ignore
    }
  }

  async logoutAll(userId: string): Promise<void> {
    await this.tokens.revokeAllForUser(userId);
  }

  private decodeJti(token: string): string | null {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    try {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
      return payload.jti ?? null;
    } catch {
      return null;
    }
  }
}

export interface PublicUser {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  role: UserRole;
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    phone: user.phone,
    name: user.name,
    email: user.email,
    role: user.role as UserRole,
  };
}
