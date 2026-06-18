import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisService } from './redis.service';
import { RedisThrottlerStorage } from './throttler-storage.redis';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      inject: [ConfigService],
      useFactory: (config: ConfigService): Redis => RedisService.forRoot(config),
    },
    RedisService,
    RedisThrottlerStorage,
  ],
  exports: [RedisService, 'REDIS_CLIENT', RedisThrottlerStorage],
})
export class RedisModule {}
