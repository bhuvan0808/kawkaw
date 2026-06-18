import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginationQueryDto, paginate } from '../../common/dto/pagination.dto';
import { RiderStatus, UserRole } from '../../common/enums';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { EventsGateway } from '../../websocket/events.gateway';
import {
  RegisterRiderDto,
  UpdateLocationDto,
  UpdateRiderStatusDto,
  VerifyRiderDto,
} from './dto/rider.dto';

const LOCATION_CACHE_TTL = 120; // seconds

@Injectable()
export class RidersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly events: EventsGateway,
  ) {}

  private locationKey(riderId: string): string {
    return `rider:location:${riderId}`;
  }

  /** A user registers a rider profile; role is elevated and verification pending. */
  async register(userId: string, dto: RegisterRiderDto) {
    const existing = await this.prisma.rider.findUnique({ where: { userId } });
    if (existing) throw new BadRequestException('Rider profile already exists');

    return this.prisma.$transaction(async (tx) => {
      const rider = await tx.rider.create({
        data: {
          userId,
          vehicleType: dto.vehicleType,
          vehicleNumber: dto.vehicleNumber,
          licenseNumber: dto.licenseNumber,
          status: RiderStatus.OFFLINE,
          isVerified: false,
        },
      });
      await tx.user.update({ where: { id: userId }, data: { role: UserRole.RIDER } });
      return rider;
    });
  }

  async getByUserId(userId: string) {
    const rider = await this.prisma.rider.findFirst({
      where: { userId, deletedAt: null },
      include: { user: { select: { id: true, name: true, phone: true } } },
    });
    if (!rider) throw new NotFoundException('Rider profile not found');
    return rider;
  }

  async requireRider(riderId: string) {
    const rider = await this.prisma.rider.findFirst({ where: { id: riderId, deletedAt: null } });
    if (!rider) throw new NotFoundException('Rider not found');
    return rider;
  }

  async setStatus(riderId: string, dto: UpdateRiderStatusDto) {
    const rider = await this.requireRider(riderId);
    if (!rider.isVerified && dto.status === RiderStatus.ONLINE) {
      throw new ForbiddenException('Rider must be verified before going online');
    }
    return this.prisma.rider.update({ where: { id: riderId }, data: { status: dto.status } });
  }

  /**
   * Updates rider location. Hot path: cache in Redis + emit to the active order
   * room. Persist a RiderLocation row for history (kept lean).
   */
  async updateLocation(riderId: string, dto: UpdateLocationDto) {
    await this.requireRider(riderId);

    // Best-effort hot cache; PostgreSQL below is authoritative for last-known location.
    try {
      await this.redis.setJson(
        this.locationKey(riderId),
        { ...dto, at: new Date().toISOString() },
        LOCATION_CACHE_TTL,
      );
    } catch {
      // Redis outage must not stop location updates from persisting.
    }

    await this.prisma.rider.update({
      where: { id: riderId },
      data: {
        currentLatitude: dto.latitude,
        currentLongitude: dto.longitude,
        lastLocationAt: new Date(),
      },
    });

    await this.prisma.riderLocation.create({
      data: {
        riderId,
        latitude: dto.latitude,
        longitude: dto.longitude,
        accuracy: dto.accuracy,
        heading: dto.heading,
        speed: dto.speed,
      },
    });

    // Broadcast to any in-flight order assigned to this rider.
    const activeOrder = await this.prisma.order.findFirst({
      where: {
        riderId,
        deletedAt: null,
        status: { in: ['ACCEPTED', 'PICKED_UP', 'OUT_FOR_DELIVERY'] },
      },
      select: { id: true },
    });
    if (activeOrder) {
      this.events.emitRiderLocation(activeOrder.id, {
        riderId,
        latitude: dto.latitude,
        longitude: dto.longitude,
        heading: dto.heading,
      });
    }
    return { success: true };
  }

  async getCachedLocation(riderId: string) {
    try {
      const cached = await this.redis.getJson(this.locationKey(riderId));
      if (cached) return cached;
    } catch {
      // Fall through to the authoritative DB value on Redis outage.
    }
    const rider = await this.requireRider(riderId);
    return {
      latitude: rider.currentLatitude,
      longitude: rider.currentLongitude,
      at: rider.lastLocationAt,
    };
  }

  async earnings(riderId: string) {
    const rider = await this.requireRider(riderId);
    const delivered = await this.prisma.order.count({
      where: { riderId, status: 'DELIVERED', deletedAt: null },
    });
    return {
      totalEarnings: Number(rider.totalEarnings),
      totalDeliveries: rider.totalDeliveries,
      deliveredOrders: delivered,
      rating: rider.rating,
    };
  }

  /**
   * Earnings broken down by Today / This Week / This Month / Lifetime.
   * A rider earns the delivery fee of each DELIVERED order and parcel.
   */
  async earningsSummary(riderId: string) {
    const rider = await this.requireRider(riderId);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - ((startOfToday.getDay() + 6) % 7)); // Monday
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const periodFor = async (since?: Date) => {
      const orderWhere = {
        riderId,
        status: 'DELIVERED' as const,
        deletedAt: null,
        ...(since ? { deliveredAt: { gte: since } } : {}),
      };
      const parcelWhere = {
        riderId,
        status: 'DELIVERED' as const,
        deletedAt: null,
        ...(since ? { deliveredAt: { gte: since } } : {}),
      };
      const [orderAgg, orderCount, parcelAgg, parcelCount] = await this.prisma.$transaction([
        this.prisma.order.aggregate({ where: orderWhere, _sum: { deliveryFee: true } }),
        this.prisma.order.count({ where: orderWhere }),
        this.prisma.parcelOrder.aggregate({ where: parcelWhere, _sum: { deliveryFee: true } }),
        this.prisma.parcelOrder.count({ where: parcelWhere }),
      ]);
      return {
        earnings:
          Number(orderAgg._sum.deliveryFee ?? 0) + Number(parcelAgg._sum.deliveryFee ?? 0),
        deliveries: orderCount + parcelCount,
      };
    };

    const [today, week, month, lifetime] = await Promise.all([
      periodFor(startOfToday),
      periodFor(startOfWeek),
      periodFor(startOfMonth),
      periodFor(undefined),
    ]);

    return {
      today,
      week,
      month,
      lifetime,
      rating: rider.rating,
      totalEarnings: Number(rider.totalEarnings),
    };
  }

  // --- Admin ---------------------------------------------------------------

  async list(query: PaginationQueryDto, status?: RiderStatus) {
    const where: Prisma.RiderWhereInput = {
      deletedAt: null,
      ...(status ? { status } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.rider.findMany({
        where,
        include: { user: { select: { id: true, name: true, phone: true } } },
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.take,
      }),
      this.prisma.rider.count({ where }),
    ]);
    return paginate(items, total, query.page, query.pageSize);
  }

  async verify(riderId: string, dto: VerifyRiderDto) {
    await this.requireRider(riderId);
    return this.prisma.rider.update({
      where: { id: riderId },
      data: { isVerified: dto.isVerified },
    });
  }
}
