import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ParcelOrder, Prisma } from '@prisma/client';
import { PaginationQueryDto, paginate } from '../../common/dto/pagination.dto';
import {
  NotificationType,
  OrderStatus,
  ORDER_STATUS_TRANSITIONS,
  PaymentStatus,
} from '../../common/enums';
import { haversineKm } from '../../common/utils/geo.util';
import { generateOrderNumber } from '../../common/utils/slug.util';
import { PrismaService } from '../../prisma/prisma.service';
import { EventsGateway } from '../../websocket/events.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { SettingsService } from '../settings/settings.service';
import { CreateParcelDto } from './dto/parcel.dto';

const PARCEL_BASE_FEE_KEY = 'parcel_base_fee';
const PARCEL_PER_KM_KEY = 'parcel_per_km';

@Injectable()
export class ParcelsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
    private readonly notifications: NotificationsService,
    private readonly events: EventsGateway,
  ) {}

  async quote(dto: CreateParcelDto) {
    const distanceKm =
      Math.round(
        haversineKm(dto.pickupLatitude, dto.pickupLongitude, dto.dropLatitude, dto.dropLongitude) *
          100,
      ) / 100;
    const base = await this.settings.getNumber(PARCEL_BASE_FEE_KEY, 30);
    const perKm = await this.settings.getNumber(PARCEL_PER_KM_KEY, 8);
    const fee = Math.round((base + perKm * distanceKm) * 100) / 100;
    return { distanceKm, deliveryFee: fee, total: fee };
  }

  async create(userId: string, dto: CreateParcelDto): Promise<ParcelOrder> {
    const { distanceKm, deliveryFee, total } = await this.quote(dto);

    const parcel = await this.prisma.parcelOrder.create({
      data: {
        orderNumber: generateOrderNumber('KK-X'),
        userId,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        pickupContactName: dto.pickupContactName,
        pickupContactPhone: dto.pickupContactPhone,
        pickupLine1: dto.pickupLine1,
        pickupLandmark: dto.pickupLandmark,
        pickupLatitude: dto.pickupLatitude,
        pickupLongitude: dto.pickupLongitude,
        receiverName: dto.receiverName,
        receiverPhone: dto.receiverPhone,
        dropLine1: dto.dropLine1,
        dropLandmark: dto.dropLandmark,
        dropLatitude: dto.dropLatitude,
        dropLongitude: dto.dropLongitude,
        packageType: dto.packageType,
        weightKg: dto.weightKg,
        instructions: dto.instructions,
        distanceKm,
        deliveryFee,
        total,
      },
    });

    this.events.emitOrderStatus(parcel.id, { parcelId: parcel.id, status: parcel.status });
    await this.notifications.dispatch({
      userId,
      type: NotificationType.ORDER_UPDATE,
      title: 'Parcel booked',
      body: `Your parcel ${parcel.orderNumber} has been booked.`,
      data: { parcelId: parcel.id, status: parcel.status },
    });
    return parcel;
  }

  async listForUser(userId: string, query: PaginationQueryDto) {
    const where: Prisma.ParcelOrderWhereInput = { userId, deletedAt: null };
    return this.paginate(where, query);
  }

  async listAll(query: PaginationQueryDto) {
    const where: Prisma.ParcelOrderWhereInput = {
      deletedAt: null,
      ...(query.search ? { orderNumber: { contains: query.search, mode: 'insensitive' } } : {}),
    };
    return this.paginate(where, query);
  }

  async getForUser(userId: string, id: string) {
    const parcel = await this.prisma.parcelOrder.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!parcel) throw new NotFoundException('Parcel not found');
    return parcel;
  }

  async getById(id: string) {
    const parcel = await this.prisma.parcelOrder.findFirst({ where: { id, deletedAt: null } });
    if (!parcel) throw new NotFoundException('Parcel not found');
    return parcel;
  }

  async riderQueue(riderId: string) {
    return this.prisma.parcelOrder.findMany({
      where: {
        riderId,
        deletedAt: null,
        status: {
          in: [
            OrderStatus.ASSIGNED,
            OrderStatus.ACCEPTED,
            OrderStatus.PICKED_UP,
            OrderStatus.OUT_FOR_DELIVERY,
          ],
        },
      },
      orderBy: { assignedAt: 'asc' },
    });
  }

  async assignRider(parcelId: string, riderId: string) {
    const parcel = await this.getById(parcelId);
    this.assertTransition(parcel.status as OrderStatus, OrderStatus.ASSIGNED);
    const rider = await this.prisma.rider.findFirst({
      where: { id: riderId, deletedAt: null, isVerified: true },
      include: { user: { select: { id: true } } },
    });
    if (!rider) throw new BadRequestException('Rider not found or not verified');

    const updated = await this.prisma.parcelOrder.update({
      where: { id: parcelId },
      data: { riderId, status: OrderStatus.ASSIGNED, assignedAt: new Date() },
    });
    this.events.emitOrderAssigned(riderId, { parcelId, orderNumber: updated.orderNumber });
    this.events.emitOrderStatus(parcelId, { parcelId, status: updated.status });
    await this.notifications.dispatch({
      userId: rider.user.id,
      type: NotificationType.RIDER_ASSIGNMENT,
      title: 'New parcel pickup',
      body: `Parcel ${updated.orderNumber} assigned to you.`,
      data: { parcelId, status: updated.status },
    });
    return updated;
  }

  async accept(parcelId: string, riderId: string) {
    return this.transitionAsRider(parcelId, riderId, OrderStatus.ACCEPTED, 'accepted');
  }

  async markPickedUp(parcelId: string, riderId: string) {
    return this.transitionAsRider(parcelId, riderId, OrderStatus.PICKED_UP, 'picked up');
  }

  async markOutForDelivery(parcelId: string, riderId: string) {
    return this.transitionAsRider(parcelId, riderId, OrderStatus.OUT_FOR_DELIVERY, 'in transit');
  }

  async markDelivered(parcelId: string, riderId: string) {
    const parcel = await this.requireRiderParcel(parcelId, riderId);
    this.assertTransition(parcel.status as OrderStatus, OrderStatus.DELIVERED);
    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.parcelOrder.update({
        where: { id: parcelId },
        data: {
          status: OrderStatus.DELIVERED,
          paymentStatus: PaymentStatus.COLLECTED,
          deliveredAt: new Date(),
        },
      });
      await tx.rider.update({
        where: { id: riderId },
        data: {
          totalDeliveries: { increment: 1 },
          totalEarnings: { increment: result.deliveryFee },
        },
      });
      return result;
    });
    this.events.emitOrderStatus(parcelId, { parcelId, status: updated.status });
    await this.notifications.dispatch({
      userId: updated.userId,
      type: NotificationType.ORDER_UPDATE,
      title: `Parcel ${updated.orderNumber}`,
      body: 'Your parcel has been delivered.',
      data: { parcelId, status: updated.status },
    });
    return updated;
  }

  async cancel(parcelId: string, reason: string, actorId: string, isAdmin: boolean) {
    const parcel = await this.getById(parcelId);
    if (!isAdmin && parcel.userId !== actorId) {
      throw new ForbiddenException('You cannot cancel this parcel');
    }
    const cancellable: OrderStatus[] = [
      OrderStatus.PENDING,
      OrderStatus.ASSIGNED,
      OrderStatus.ACCEPTED,
    ];
    if (!cancellable.includes(parcel.status as OrderStatus)) {
      throw new BadRequestException('Parcel can no longer be cancelled');
    }
    const updated = await this.prisma.parcelOrder.update({
      where: { id: parcelId },
      data: { status: OrderStatus.CANCELLED, cancellationReason: reason, cancelledAt: new Date() },
    });
    this.events.emitOrderStatus(parcelId, { parcelId, status: updated.status });
    return updated;
  }

  // --- helpers -------------------------------------------------------------

  private async transitionAsRider(
    parcelId: string,
    riderId: string,
    to: OrderStatus,
    label: string,
  ) {
    const parcel = await this.requireRiderParcel(parcelId, riderId);
    this.assertTransition(parcel.status as OrderStatus, to);
    const data: Prisma.ParcelOrderUpdateInput = { status: to };
    if (to === OrderStatus.ACCEPTED) data.acceptedAt = new Date();
    if (to === OrderStatus.PICKED_UP) data.pickedUpAt = new Date();
    if (to === OrderStatus.OUT_FOR_DELIVERY) data.outForDeliveryAt = new Date();
    const updated = await this.prisma.parcelOrder.update({ where: { id: parcelId }, data });
    this.events.emitOrderStatus(parcelId, { parcelId, status: updated.status });
    await this.notifications.dispatch({
      userId: updated.userId,
      type: NotificationType.ORDER_UPDATE,
      title: `Parcel ${updated.orderNumber}`,
      body: `Your parcel is ${label}.`,
      data: { parcelId, status: updated.status },
    });
    return updated;
  }

  private async requireRiderParcel(parcelId: string, riderId: string) {
    const parcel = await this.prisma.parcelOrder.findFirst({
      where: { id: parcelId, riderId, deletedAt: null },
    });
    if (!parcel) throw new NotFoundException('Parcel not found or not assigned to you');
    return parcel;
  }

  private assertTransition(from: OrderStatus, to: OrderStatus): void {
    const allowed = ORDER_STATUS_TRANSITIONS[from] ?? [];
    if (!allowed.includes(to)) {
      throw new BadRequestException(`Cannot move parcel from ${from} to ${to}`);
    }
  }

  private async paginate(where: Prisma.ParcelOrderWhereInput, query: PaginationQueryDto) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.parcelOrder.findMany({
        where,
        orderBy: { placedAt: 'desc' },
        skip: query.skip,
        take: query.take,
      }),
      this.prisma.parcelOrder.count({ where }),
    ]);
    return paginate(items, total, query.page, query.pageSize);
  }
}
