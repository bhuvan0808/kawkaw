import { Injectable } from '@nestjs/common';
import { OrderStatus, RiderStatus, UserRole } from '../../common/enums';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAdminDto } from './dto/admin.dto';

@Injectable()
export class AdminsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Aggregated counts for the dashboard landing page. */
  async dashboard() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalRiders,
      onlineRiders,
      totalProducts,
      ordersByStatus,
      todayOrders,
      pendingPrescriptions,
      revenueAgg,
    ] = await this.prisma.$transaction([
      this.prisma.user.count({ where: { deletedAt: null, role: UserRole.CUSTOMER } }),
      this.prisma.rider.count({ where: { deletedAt: null } }),
      this.prisma.rider.count({ where: { deletedAt: null, status: RiderStatus.ONLINE } }),
      this.prisma.product.count({ where: { deletedAt: null, isActive: true } }),
      this.prisma.order.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: true,
        orderBy: { status: 'asc' },
      }),
      this.prisma.order.count({ where: { deletedAt: null, placedAt: { gte: startOfDay } } }),
      this.prisma.prescriptionUpload.count({ where: { deletedAt: null, status: 'PENDING' } }),
      this.prisma.order.aggregate({
        where: { deletedAt: null, status: OrderStatus.DELIVERED, deliveredAt: { gte: startOfDay } },
        _sum: { total: true },
      }),
    ]);

    return {
      totalUsers,
      totalRiders,
      onlineRiders,
      totalProducts,
      todayOrders,
      pendingPrescriptions,
      revenueToday: Number(revenueAgg._sum.total ?? 0),
      ordersByStatus: ordersByStatus.reduce<Record<string, number>>((acc, row) => {
        acc[row.status] = Number(row._count ?? 0);
        return acc;
      }, {}),
    };
  }

  /** Revenue + order counts for the last N days. */
  async analytics(days = 7) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const rows = await this.prisma.$queryRaw<
      Array<{ day: Date; orders: bigint; revenue: number }>
    >`SELECT date_trunc('day', "placedAt") AS day,
             COUNT(*)::bigint AS orders,
             COALESCE(SUM(CASE WHEN status = 'DELIVERED' THEN total ELSE 0 END), 0)::float8 AS revenue
      FROM orders
      WHERE "deletedAt" IS NULL AND "placedAt" >= ${since}
      GROUP BY day
      ORDER BY day ASC`;

    const topProducts = await this.prisma.$queryRaw<
      Array<{ productName: string; qty: bigint }>
    >`SELECT "productName", SUM(quantity)::bigint AS qty
      FROM order_items
      WHERE "deletedAt" IS NULL
      GROUP BY "productName"
      ORDER BY qty DESC
      LIMIT 10`;

    // Orders + delivered-revenue split by service line over the window.
    const serviceRows = await this.prisma.$queryRaw<
      Array<{ serviceType: string; orders: bigint; revenue: number }>
    >`SELECT "serviceType",
             COUNT(*)::bigint AS orders,
             COALESCE(SUM(CASE WHEN status = 'DELIVERED' THEN total ELSE 0 END), 0)::float8 AS revenue
      FROM orders
      WHERE "deletedAt" IS NULL AND "placedAt" >= ${since}
      GROUP BY "serviceType"
      ORDER BY orders DESC`;

    // Top riders by completed deliveries + payout earned in the window.
    const riderRows = await this.prisma.$queryRaw<
      Array<{ riderId: string; name: string | null; phone: string; deliveries: bigint; earnings: number }>
    >`SELECT r.id AS "riderId", u.name, u.phone,
             COUNT(o.id)::bigint AS deliveries,
             COALESCE(SUM(o."deliveryFee"), 0)::float8 AS earnings
      FROM orders o
      JOIN riders r ON o."riderId" = r.id
      JOIN users u ON r."userId" = u.id
      WHERE o."deletedAt" IS NULL AND o.status = 'DELIVERED' AND o."deliveredAt" >= ${since}
      GROUP BY r.id, u.name, u.phone
      ORDER BY deliveries DESC
      LIMIT 10`;

    return {
      days,
      series: rows.map((r) => ({
        day: r.day,
        orders: Number(r.orders),
        revenue: Number(r.revenue),
      })),
      topProducts: topProducts.map((p) => ({ name: p.productName, quantity: Number(p.qty) })),
      serviceBreakdown: serviceRows.map((s) => ({
        serviceType: s.serviceType,
        orders: Number(s.orders),
        revenue: Number(s.revenue),
      })),
      riderPerformance: riderRows.map((r) => ({
        riderId: r.riderId,
        name: r.name,
        phone: r.phone,
        deliveries: Number(r.deliveries),
        earnings: Number(r.earnings),
      })),
    };
  }

  async listAdmins() {
    return this.prisma.admin.findMany({
      where: { deletedAt: null },
      include: {
        user: { select: { id: true, name: true, phone: true, role: true, isActive: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Create or elevate a user to an admin role, with an Admin profile. */
  async createAdmin(dto: CreateAdminDto) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.upsert({
        where: { phone: dto.phone },
        create: { phone: dto.phone, name: dto.name, role: dto.role },
        update: { role: dto.role, name: dto.name ?? undefined, deletedAt: null },
      });
      const admin = await tx.admin.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          department: dto.department,
          permissions: dto.permissions ?? [],
          isActive: true,
        },
        update: {
          department: dto.department ?? undefined,
          permissions: dto.permissions ?? undefined,
          isActive: true,
          deletedAt: null,
        },
      });
      return { ...admin, user };
    });
  }
}
