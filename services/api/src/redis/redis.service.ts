import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Centralized Redis access. Redis is used ONLY for ephemeral data:
 * OTP attempt counters, rate-limit buckets, refresh-token revocation cache,
 * rider live-location cache, and the notification queue.
 *
 * Redis is never the source of truth — PostgreSQL is. A Redis flush must not
 * lose any business data.
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  constructor(@Inject('REDIS_CLIENT') public readonly client: Redis) {}

  static forRoot(config: ConfigService): Redis {
    const url = config.get<string>('redis.url') as string;
    const client = new Redis(url, {
      maxRetriesPerRequest: 1,
      // Fail fast when Redis is unreachable so cache/rate-limit ops never HANG a
      // request — callers treat Redis as best-effort and degrade gracefully.
      enableOfflineQueue: false,
      enableReadyCheck: true,
      lazyConnect: false,
      retryStrategy: (times) => Math.min(times * 200, 2000),
      tls: url.startsWith('rediss://') ? {} : undefined,
    });
    // Prevent unhandled 'error' events from crashing the process during outages.
    client.on('error', () => undefined);
    return client;
  }

  onModuleInit(): void {
    this.client.on('connect', () => this.logger.log('Connected to Redis'));
    this.client.on('error', (err) => this.logger.error(`Redis error: ${err.message}`));
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.client.quit();
    } catch {
      // Connection may already be down; force-close without throwing on shutdown.
      this.client.disconnect();
    }
  }

  // --- Generic key/value with TTL ------------------------------------------

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async del(...keys: string[]): Promise<number> {
    if (keys.length === 0) return 0;
    return this.client.del(...keys);
  }

  async setJson<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds);
  }

  async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.client.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  }

  async exists(key: string): Promise<boolean> {
    return (await this.client.exists(key)) === 1;
  }

  // --- Counters (rate limiting, OTP attempts) ------------------------------

  /** Atomically increments a counter, setting TTL on first increment. Returns new count. */
  async increment(key: string, ttlSeconds: number): Promise<number> {
    const count = await this.client.incr(key);
    if (count === 1) {
      await this.client.expire(key, ttlSeconds);
    }
    return count;
  }

  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  // --- Queues (notifications) ----------------------------------------------

  async enqueue(queue: string, payload: unknown): Promise<void> {
    await this.client.rpush(queue, JSON.stringify(payload));
  }

  async dequeue<T>(queue: string): Promise<T | null> {
    const raw = await this.client.lpop(queue);
    return raw ? (JSON.parse(raw) as T) : null;
  }

  async queueLength(queue: string): Promise<number> {
    return this.client.llen(queue);
  }

  async ping(): Promise<boolean> {
    const res = await this.client.ping();
    return res === 'PONG';
  }
}
