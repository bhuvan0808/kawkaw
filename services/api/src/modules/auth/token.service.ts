import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomUUID } from 'crypto';
import { User } from '@prisma/client';
import { JwtConfig } from '../../common/config/configuration';
import {
  JwtAccessPayload,
  JwtRefreshPayload,
} from '../../common/interfaces/authenticated-user.interface';
import { UserRole } from '../../common/enums';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface RequestMeta {
  userAgent?: string;
  ipAddress?: string;
}

/**
 * Issues, rotates and revokes JWT access/refresh tokens.
 * Refresh tokens are single-use: every refresh rotates the jti and revokes the
 * previous one. State lives in PostgreSQL (RefreshToken) and is mirrored in
 * Redis for O(1) revocation checks.
 */
@Injectable()
export class TokenService {
  private readonly jwtCfg: JwtConfig;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {
    this.jwtCfg = this.config.get<JwtConfig>('jwt') as JwtConfig;
  }

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private revokeCacheKey(jti: string): string {
    return `refresh:active:${jti}`;
  }

  async issueTokens(
    user: Pick<User, 'id' | 'phone' | 'role'>,
    meta: RequestMeta = {},
  ): Promise<IssuedTokens> {
    const riderId = await this.resolveRiderId(user.id, user.role);

    const accessPayload: JwtAccessPayload = {
      sub: user.id,
      phone: user.phone,
      role: user.role as UserRole,
      riderId,
      type: 'access',
    };
    const accessToken = await this.jwt.signAsync(accessPayload, {
      secret: this.jwtCfg.secret,
      // expiresIn accepts ms-style strings ('15m'); cast past the strict ms StringValue type.
      expiresIn: this.jwtCfg.accessExpiresIn as unknown as number,
    });

    const jti = randomUUID();
    const refreshPayload: JwtRefreshPayload = { sub: user.id, jti, type: 'refresh' };
    const refreshToken = await this.jwt.signAsync(refreshPayload, {
      secret: this.jwtCfg.refreshSecret,
      expiresIn: this.jwtCfg.refreshExpiresIn as unknown as number,
    });

    const decoded = this.jwt.decode(refreshToken) as { exp: number };
    const expiresAt = new Date(decoded.exp * 1000);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        jti,
        tokenHash: this.hash(refreshToken),
        expiresAt,
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress,
      },
    });

    // Best-effort cache for fast revocation checks. Redis is never authoritative,
    // so a cache write failure must not break login.
    const ttlSeconds = Math.max(1, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
    await this.safeRedis(() => this.redis.set(this.revokeCacheKey(jti), user.id, ttlSeconds));

    const accessDecoded = this.jwt.decode(accessToken) as { exp: number; iat: number };
    return {
      accessToken,
      refreshToken,
      expiresIn: accessDecoded.exp - accessDecoded.iat,
    };
  }

  async rotateRefreshToken(token: string, meta: RequestMeta = {}): Promise<IssuedTokens> {
    let payload: JwtRefreshPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtRefreshPayload>(token, {
        secret: this.jwtCfg.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // PostgreSQL is authoritative for revocation. Redis is only a fast-path
    // optimization and must not be required for refresh to work.
    const stored = await this.prisma.refreshToken.findUnique({ where: { jti: payload.jti } });

    if (!stored || stored.revokedAt || stored.deletedAt) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }
    if (stored.tokenHash !== this.hash(token)) {
      // Token reuse / mismatch — revoke the whole chain defensively.
      await this.revokeAllForUser(stored.userId);
      throw new UnauthorizedException('Refresh token reuse detected');
    }
    if (stored.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: stored.userId, deletedAt: null, isActive: true },
    });
    if (!user) {
      throw new UnauthorizedException('User no longer active');
    }

    const next = await this.issueTokens(user, meta);

    // Revoke the consumed token (rotation).
    await this.prisma.refreshToken.update({
      where: { jti: payload.jti },
      data: { revokedAt: new Date() },
    });
    await this.safeRedis(() => this.redis.del(this.revokeCacheKey(payload.jti)));

    return next;
  }

  async revoke(jti: string): Promise<void> {
    // DB write is authoritative; Redis del is best-effort.
    await this.prisma.refreshToken.updateMany({
      where: { jti, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await this.safeRedis(() => this.redis.del(this.revokeCacheKey(jti)));
  }

  async revokeAllForUser(userId: string): Promise<void> {
    const tokens = await this.prisma.refreshToken.findMany({
      where: { userId, revokedAt: null },
      select: { jti: true },
    });
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (tokens.length > 0) {
      await this.safeRedis(() => this.redis.del(...tokens.map((t) => this.revokeCacheKey(t.jti))));
    }
  }

  /** Runs a Redis op without letting a Redis outage break the auth flow. */
  private async safeRedis(op: () => Promise<unknown>): Promise<void> {
    try {
      await op();
    } catch {
      // Redis is a cache, not the source of truth — ignore and continue.
    }
  }

  private async resolveRiderId(userId: string, role: string): Promise<string | undefined> {
    if (role !== UserRole.RIDER) return undefined;
    const rider = await this.prisma.rider.findUnique({
      where: { userId },
      select: { id: true },
    });
    return rider?.id;
  }
}
