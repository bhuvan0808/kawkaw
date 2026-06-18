import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { BusinessConfig } from '../../common/config/configuration';
import { PrismaService } from '../../prisma/prisma.service';
import { UpsertSettingDto } from './dto/setting.dto';

export const SETTING_KEYS = {
  DELIVERY_FEE: 'delivery_fee',
  FREE_DELIVERY_ABOVE: 'free_delivery_above',
  TAX_PERCENT: 'tax_percent',
  STORE_OPEN: 'store_open',
  SERVICE_RADIUS_KM: 'service_radius_km',
  LAUNCH_CITY: 'launch_city',
} as const;

@Injectable()
export class SettingsService implements OnModuleInit {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /** Seed business defaults on first boot (idempotent). */
  async onModuleInit(): Promise<void> {
    const business = this.config.get<BusinessConfig>('business') as BusinessConfig;
    const defaults: Array<UpsertSettingDto> = [
      {
        key: SETTING_KEYS.DELIVERY_FEE,
        value: business.defaultDeliveryFee,
        category: 'orders',
        isPublic: true,
        description: 'Flat delivery fee (₹)',
      },
      {
        key: SETTING_KEYS.FREE_DELIVERY_ABOVE,
        value: 499,
        category: 'orders',
        isPublic: true,
        description: 'Free delivery above this subtotal (₹)',
      },
      {
        key: SETTING_KEYS.TAX_PERCENT,
        value: 0,
        category: 'orders',
        isPublic: true,
        description: 'Tax percentage applied to subtotal',
      },
      {
        key: SETTING_KEYS.STORE_OPEN,
        value: true,
        category: 'general',
        isPublic: true,
        description: 'Whether the store is accepting orders',
      },
      {
        key: SETTING_KEYS.SERVICE_RADIUS_KM,
        value: 8,
        category: 'delivery',
        isPublic: true,
        description: 'Max delivery radius in km',
      },
      {
        key: SETTING_KEYS.LAUNCH_CITY,
        value: business.launchCity,
        category: 'general',
        isPublic: true,
        description: 'Launch city',
      },
    ];
    try {
      for (const d of defaults) {
        await this.prisma.setting.upsert({
          where: { key: d.key },
          update: {},
          create: {
            key: d.key,
            value: d.value as Prisma.InputJsonValue,
            description: d.description,
            category: d.category ?? 'general',
            isPublic: d.isPublic ?? false,
          },
        });
      }
      this.logger.log('Default settings ensured');
    } catch (err) {
      // DB may not be migrated yet on first ever boot — log and continue.
      this.logger.warn(`Could not seed settings: ${(err as Error).message}`);
    }
  }

  async getValue<T = unknown>(key: string, fallback: T): Promise<T> {
    const setting = await this.prisma.setting.findFirst({ where: { key, deletedAt: null } });
    return setting ? (setting.value as T) : fallback;
  }

  async getNumber(key: string, fallback: number): Promise<number> {
    const value = await this.getValue<unknown>(key, fallback);
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  async listPublic() {
    return this.prisma.setting.findMany({
      where: { deletedAt: null, isPublic: true },
      select: { key: true, value: true, category: true },
    });
  }

  async listAll() {
    return this.prisma.setting.findMany({ where: { deletedAt: null }, orderBy: { key: 'asc' } });
  }

  async upsert(dto: UpsertSettingDto) {
    return this.prisma.setting.upsert({
      where: { key: dto.key },
      update: {
        value: dto.value as Prisma.InputJsonValue,
        description: dto.description,
        category: dto.category ?? undefined,
        isPublic: dto.isPublic ?? undefined,
      },
      create: {
        key: dto.key,
        value: dto.value as Prisma.InputJsonValue,
        description: dto.description,
        category: dto.category ?? 'general',
        isPublic: dto.isPublic ?? false,
      },
    });
  }
}
