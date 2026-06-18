import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Coupon, Prisma } from '@prisma/client';
import { CouponType, ServiceType } from '../../common/enums';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCouponDto, UpdateCouponDto } from './dto/coupon.dto';

export interface CouponEvaluation {
  coupon: Coupon;
  discount: number;
}

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validates a coupon for a user/subtotal and returns the computed discount.
   * Throws BadRequestException with a clear reason if not applicable.
   */
  async evaluate(
    code: string,
    userId: string,
    subtotal: number,
    serviceType?: ServiceType,
  ): Promise<CouponEvaluation> {
    const coupon = await this.prisma.coupon.findFirst({
      where: { code: code.trim().toUpperCase(), deletedAt: null },
    });
    if (!coupon || !coupon.isActive) {
      throw new BadRequestException('Invalid coupon code');
    }

    const now = new Date();
    if (coupon.validFrom && coupon.validFrom > now) {
      throw new BadRequestException('Coupon is not active yet');
    }
    if (coupon.validUntil && coupon.validUntil < now) {
      throw new BadRequestException('Coupon has expired');
    }
    if (coupon.serviceType && serviceType && coupon.serviceType !== serviceType) {
      throw new BadRequestException('Coupon not valid for this service');
    }
    if (subtotal < Number(coupon.minOrderValue)) {
      throw new BadRequestException(
        `Minimum order value of ₹${coupon.minOrderValue} required for this coupon`,
      );
    }
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException('Coupon usage limit reached');
    }

    const userUses = await this.prisma.order.count({
      where: { userId, couponId: coupon.id, deletedAt: null, status: { not: 'CANCELLED' } },
    });
    if (userUses >= coupon.perUserLimit) {
      throw new BadRequestException('You have already used this coupon');
    }

    let discount =
      coupon.type === CouponType.PERCENTAGE
        ? (subtotal * Number(coupon.value)) / 100
        : Number(coupon.value);

    if (coupon.maxDiscount !== null) {
      discount = Math.min(discount, Number(coupon.maxDiscount));
    }
    discount = Math.min(discount, subtotal);
    discount = Math.round(discount * 100) / 100;

    return { coupon, discount };
  }

  /** Increment usage count within an order transaction. */
  async consume(tx: Prisma.TransactionClient, couponId: string): Promise<void> {
    await tx.coupon.update({
      where: { id: couponId },
      data: { usedCount: { increment: 1 } },
    });
  }

  // --- Admin CRUD ----------------------------------------------------------

  async list() {
    return this.prisma.coupon.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const coupon = await this.prisma.coupon.findFirst({ where: { id, deletedAt: null } });
    if (!coupon) throw new NotFoundException('Coupon not found');
    return coupon;
  }

  async create(dto: CreateCouponDto) {
    return this.prisma.coupon.create({
      data: {
        code: dto.code,
        type: dto.type,
        value: dto.value,
        minOrderValue: dto.minOrderValue ?? 0,
        maxDiscount: dto.maxDiscount,
        usageLimit: dto.usageLimit,
        perUserLimit: dto.perUserLimit ?? 1,
        serviceType: dto.serviceType,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateCouponDto) {
    await this.findOne(id);
    return this.prisma.coupon.update({
      where: { id },
      data: {
        ...dto,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.coupon.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
