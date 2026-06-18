import { Inject, Injectable, Logger } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';
import Redis from 'ioredis';

/**
 * Redis-backed storage for @nestjs/throttler so rate limiting is shared across
 * all API instances (Render may scale horizontally). ttl / blockDuration are
 * supplied in milliseconds by the ThrottlerGuard.
 *
 * Fails OPEN: if Redis is unreachable, requests are allowed rather than 500'd.
 * Rate limiting is a best-effort protection, never a hard dependency — Postgres
 * remains the source of truth and the API must keep serving during a Redis outage.
 */
@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
  private readonly logger = new Logger(RedisThrottlerStorage.name);

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    try {
      return await this.incrementInRedis(key, ttl, limit, blockDuration, throttlerName);
    } catch (err) {
      this.logger.warn(`Throttler Redis unavailable, failing open: ${(err as Error).message}`);
      // Allow the request: report a single hit well under any limit.
      return {
        totalHits: 1,
        timeToExpire: Math.ceil(ttl / 1000),
        isBlocked: false,
        timeToBlockExpire: 0,
      };
    }
  }

  private async incrementInRedis(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const countKey = `throttle:${throttlerName}:${key}`;
    const blockKey = `throttle:${throttlerName}:${key}:blocked`;

    const blockedPttl = await this.redis.pttl(blockKey);
    if (blockedPttl > 0) {
      return {
        totalHits: limit + 1,
        timeToExpire: Math.ceil(blockedPttl / 1000),
        isBlocked: true,
        timeToBlockExpire: Math.ceil(blockedPttl / 1000),
      };
    }

    const totalHits = await this.redis.incr(countKey);
    if (totalHits === 1) {
      await this.redis.pexpire(countKey, ttl);
    }
    const pttl = await this.redis.pttl(countKey);
    const timeToExpire = Math.ceil((pttl > 0 ? pttl : ttl) / 1000);

    let isBlocked = false;
    let timeToBlockExpire = 0;
    if (totalHits > limit) {
      isBlocked = true;
      if (blockDuration > 0) {
        await this.redis.set(blockKey, '1', 'PX', blockDuration);
        timeToBlockExpire = Math.ceil(blockDuration / 1000);
      } else {
        timeToBlockExpire = timeToExpire;
      }
    }

    return { totalHits, timeToExpire, isBlocked, timeToBlockExpire };
  }
}
