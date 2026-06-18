import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Order, Prisma } from '@prisma/client';
import { paginate } from '../../common/dto/pagination.dto';
import {
  NotificationType,
  OrderStatus,
  ORDER_STATUS_TRANSITIONS,
  PaymentStatus,
  ServiceType,
} from '../../common/enums';
import { generateOrderNumber } from '../../common/utils/slug.util';
import { PrismaService } from '../../prisma/prisma.service';
import { EventsGateway } from '../../websocket/events.gateway';
import { CouponsService } from '../coupons/coupons.service';
import { InventoryService } from '../inventory/inventory.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SettingsService, SETTING_KEYS } from '../settings/settings.service';
import { CreateOrderDto, OrderQueryDto } from './dto/order.dto';

const ORDER_INCLUDE = {
  items: true,
  address: true,
  user: { select: { name: true, phone: true } },
  rider: { include: { user: { select: { name: true, phone: true } } } },
  statusHistory: { orderBy: { createdAt: 'asc' as const } },
} satisfies Prisma.OrderInclude;

const SERVICE_PREFIX: Record<ServiceType, string> = {
  GROCERY: 'KK-G',
  PHARMACY: 'KK-P',
  FOOD: 'KK-F',
  PARCEL: 'KK-X',
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
    private readonly coupons: CouponsService,
    private readonly settings: SettingsService,
    private readonly notifications: NotificationsService,
    private readonly events: EventsGateway,
  ) {}

  // ---------------------------------------------------------------------------
  // Customer: place order (COD)
  // ---------------------------------------------------------------------------

  async create(userId: string, dto: CreateOrderDto): Promise<Order> {
    const storeOpen = await this.settings.getValue<boolean>(SETTING_KEYS.STORE_OPEN, true);
    if (!storeOpen) throw new BadRequestException('The store is currently not accepting orders');

    const address = await this.prisma.address.findFirst({
      where: { id: dto.addressId, userId, deletedAt: null },
    });
    if (!address) throw new BadRequestException('Invalid delivery address');

    // Load and validate products (prices are taken server-side, never from client).
    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, deletedAt: null, isActive: true },
      include: { inventory: true },
    });
    if (products.length !== productIds.length) {
      throw new BadRequestException('One or more products are unavailable');
    }

    const productMap = new Map(products.map((p) => [p.id, p]));
    let requiresPrescription = false;
    let subtotal = 0;
    const lineItems = dto.items.map((item) => {
      const product = productMap.get(item.productId)!;
      if (product.serviceType !== dto.serviceType) {
        throw new BadRequestException(`Product ${product.name} is not part of ${dto.serviceType}`);
      }
      if (product.requiresPrescription) requiresPrescription = true;
      const unitPrice = Number(product.price);
      const lineTotal = Math.round(unitPrice * item.quantity * 100) / 100;
      subtotal += lineTotal;
      return {
        productId: product.id,
        productName: product.name,
        unitPrice,
        quantity: item.quantity,
        total: lineTotal,
      };
    });
    subtotal = Math.round(subtotal * 100) / 100;

    // Pharmacy prescription gate.
    if (dto.serviceType === ServiceType.PHARMACY && requiresPrescription && !dto.prescriptionId) {
      throw new BadRequestException('A prescription upload is required for these pharmacy items');
    }
    if (dto.prescriptionId) {
      const rx = await this.prisma.prescriptionUpload.findFirst({
        where: { id: dto.prescriptionId, userId, deletedAt: null },
      });
      if (!rx) throw new BadRequestException('Invalid prescription reference');
    }

    // Discount.
    let discount = 0;
    let couponId: string | undefined;
    if (dto.couponCode) {
      const evalResult = await this.coupons.evaluate(
        dto.couponCode,
        userId,
        subtotal,
        dto.serviceType,
      );
      discount = evalResult.discount;
      couponId = evalResult.coupon.id;
    }

    // Fees & tax from settings.
    const baseFee = await this.settings.getNumber(SETTING_KEYS.DELIVERY_FEE, 20);
    const freeAbove = await this.settings.getNumber(SETTING_KEYS.FREE_DELIVERY_ABOVE, 499);
    const taxPercent = await this.settings.getNumber(SETTING_KEYS.TAX_PERCENT, 0);
    const deliveryFee = subtotal >= freeAbove ? 0 : baseFee;
    const taxable = Math.max(0, subtotal - discount);
    const tax = Math.round(((taxable * taxPercent) / 100) * 100) / 100;
    const total = Math.round((taxable + deliveryFee + tax) * 100) / 100;

    const order = await this.prisma.$transaction(async (tx) => {
      await this.inventory.decrementForOrder(tx, lineItems);
      if (couponId) await this.coupons.consume(tx, couponId);

      const created = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(SERVICE_PREFIX[dto.serviceType]),
          userId,
          addressId: dto.addressId,
          couponId,
          serviceType: dto.serviceType,
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          subtotal,
          deliveryFee,
          discount,
          tax,
          total,
          notes: dto.notes,
          deliveryLatitude: address.latitude,
          deliveryLongitude: address.longitude,
          items: { create: lineItems },
          statusHistory: {
            create: { status: OrderStatus.PENDING, changedById: userId, note: 'Order placed' },
          },
        },
        include: ORDER_INCLUDE,
      });

      if (dto.prescriptionId) {
        await tx.prescriptionUpload.update({
          where: { id: dto.prescriptionId },
          data: { orderId: created.id },
        });
      }
      return created;
    });

    this.events.emitOrderStatus(order.id, { orderId: order.id, status: order.status });
    await this.notifications.dispatch({
      userId,
      type: NotificationType.ORDER_UPDATE,
      title: 'Order placed',
      body: `Your order ${order.orderNumber} has been placed and is awaiting assignment.`,
      data: { orderId: order.id, status: order.status },
    });

    return order;
  }

  // ---------------------------------------------------------------------------
  // Reads
  // ---------------------------------------------------------------------------

  async listForUser(userId: string, query: OrderQueryDto) {
    const where: Prisma.OrderWhereInput = {
      userId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.serviceType ? { serviceType: query.serviceType } : {}),
    };
    return this.paginateOrders(where, query);
  }

  async getForUser(userId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, userId, deletedAt: null },
      include: ORDER_INCLUDE,
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async getByIdOrThrow(id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, deletedAt: null },
      include: ORDER_INCLUDE,
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async listAll(query: OrderQueryDto) {
    const where: Prisma.OrderWhereInput = {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.serviceType ? { serviceType: query.serviceType } : {}),
      ...(query.search ? { orderNumber: { contains: query.search, mode: 'insensitive' } } : {}),
    };
    return this.paginateOrders(where, query);
  }

  async riderQueue(riderId: string) {
    return this.prisma.order.findMany({
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
      include: ORDER_INCLUDE,
      orderBy: { assignedAt: 'asc' },
    });
  }

  private async paginateOrders(where: Prisma.OrderWhereInput, query: OrderQueryDto) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: ORDER_INCLUDE,
        orderBy: { placedAt: 'desc' },
        skip: query.skip,
        take: query.take,
      }),
      this.prisma.order.count({ where }),
    ]);
    return paginate(items, total, query.page, query.pageSize);
  }

  // ---------------------------------------------------------------------------
  // Lifecycle transitions
  // ---------------------------------------------------------------------------

  private assertTransition(from: OrderStatus, to: OrderStatus): void {
    const allowed = ORDER_STATUS_TRANSITIONS[from] ?? [];
    if (!allowed.includes(to)) {
      throw new BadRequestException(`Cannot move order from ${from} to ${to}`);
    }
  }

  private statusTimestamp(status: OrderStatus): Prisma.OrderUncheckedUpdateInput {
    switch (status) {
      case OrderStatus.ASSIGNED:
        return { assignedAt: new Date() };
      case OrderStatus.ACCEPTED:
        return { acceptedAt: new Date() };
      case OrderStatus.PICKED_UP:
        return { pickedUpAt: new Date() };
      case OrderStatus.OUT_FOR_DELIVERY:
        return { outForDeliveryAt: new Date() };
      case OrderStatus.DELIVERED:
        return { deliveredAt: new Date() };
      case OrderStatus.CANCELLED:
        return { cancelledAt: new Date() };
      default:
        return {};
    }
  }

  /** Admin assigns a rider to a pending order. */
  async assignRider(orderId: string, riderId: string) {
    const order = await this.getByIdOrThrow(orderId);
    this.assertTransition(order.status as OrderStatus, OrderStatus.ASSIGNED);

    const rider = await this.prisma.rider.findFirst({
      where: { id: riderId, deletedAt: null, isVerified: true },
      include: { user: { select: { id: true } } },
    });
    if (!rider) throw new BadRequestException('Rider not found or not verified');

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        riderId,
        status: OrderStatus.ASSIGNED,
        ...this.statusTimestamp(OrderStatus.ASSIGNED),
        statusHistory: { create: { status: OrderStatus.ASSIGNED, note: `Assigned to rider` } },
      },
      include: ORDER_INCLUDE,
    });

    this.events.emitOrderStatus(orderId, { orderId, status: updated.status });
    this.events.emitOrderAssigned(riderId, { orderId, orderNumber: updated.orderNumber });
    await this.notifications.dispatch({
      userId: rider.user.id,
      type: NotificationType.RIDER_ASSIGNMENT,
      title: 'New delivery assigned',
      body: `Order ${updated.orderNumber} has been assigned to you.`,
      data: { orderId, status: updated.status },
    });
    await this.notifyCustomer(updated, 'A rider has been assigned to your order.');
    return updated;
  }

  /**
   * Rider-facing transitions take both the Rider profile id (for ownership) and
   * the rider's User id (recorded as the status-history actor — `changedById`
   * is a FK to User, NOT Rider).
   */
  async accept(orderId: string, riderId: string, actorUserId: string) {
    const order = await this.requireRiderOrder(orderId, riderId);
    this.assertTransition(order.status as OrderStatus, OrderStatus.ACCEPTED);
    const updated = await this.applyStatus(
      orderId,
      OrderStatus.ACCEPTED,
      actorUserId,
      'Rider accepted',
    );
    await this.notifyCustomer(updated, 'Your order has been accepted by the rider.');
    return updated;
  }

  /** Rider rejects an assigned order — it returns to the pending pool. */
  async reject(orderId: string, riderId: string, actorUserId: string, reason?: string) {
    const order = await this.requireRiderOrder(orderId, riderId);
    if (order.status !== OrderStatus.ASSIGNED) {
      throw new BadRequestException('Only assigned orders can be rejected');
    }
    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        riderId: null,
        status: OrderStatus.PENDING,
        assignedAt: null,
        statusHistory: {
          create: {
            status: OrderStatus.PENDING,
            changedById: actorUserId,
            note: `Rider rejected${reason ? `: ${reason}` : ''}`,
          },
        },
      },
      include: ORDER_INCLUDE,
    });
    this.events.emitOrderStatus(orderId, { orderId, status: updated.status });
    return updated;
  }

  async markPickedUp(orderId: string, riderId: string, actorUserId: string) {
    const order = await this.requireRiderOrder(orderId, riderId);
    this.assertTransition(order.status as OrderStatus, OrderStatus.PICKED_UP);
    const updated = await this.applyStatus(
      orderId,
      OrderStatus.PICKED_UP,
      actorUserId,
      'Picked up',
    );
    await this.notifyCustomer(updated, 'Your order has been picked up.');
    return updated;
  }

  async markOutForDelivery(orderId: string, riderId: string, actorUserId: string) {
    const order = await this.requireRiderOrder(orderId, riderId);
    this.assertTransition(order.status as OrderStatus, OrderStatus.OUT_FOR_DELIVERY);
    const updated = await this.applyStatus(
      orderId,
      OrderStatus.OUT_FOR_DELIVERY,
      actorUserId,
      'Out for delivery',
    );
    await this.notifyCustomer(updated, 'Your order is out for delivery.');
    return updated;
  }

  /** Rider confirms delivery; COD collected, rider stats updated. */
  async markDelivered(orderId: string, riderId: string, actorUserId: string) {
    const order = await this.requireRiderOrder(orderId, riderId);
    this.assertTransition(order.status as OrderStatus, OrderStatus.DELIVERED);

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.DELIVERED,
          paymentStatus: PaymentStatus.COLLECTED,
          ...this.statusTimestamp(OrderStatus.DELIVERED),
          statusHistory: {
            create: {
              status: OrderStatus.DELIVERED,
              changedById: actorUserId,
              note: 'Delivered, COD collected',
            },
          },
        },
        include: ORDER_INCLUDE,
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

    this.events.emitOrderStatus(orderId, { orderId, status: updated.status });
    await this.notifyCustomer(updated, 'Your order has been delivered. Thank you!');
    return updated;
  }

  /** Customer or admin cancels (only before pickup). Restores stock. */
  async cancel(orderId: string, reason: string, actorId: string, isAdmin: boolean) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, deletedAt: null },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (!isAdmin && order.userId !== actorId) {
      throw new ForbiddenException('You cannot cancel this order');
    }
    const cancellable: OrderStatus[] = [
      OrderStatus.PENDING,
      OrderStatus.ASSIGNED,
      OrderStatus.ACCEPTED,
    ];
    if (!cancellable.includes(order.status as OrderStatus)) {
      throw new BadRequestException('Order can no longer be cancelled');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await this.inventory.restoreForOrder(
        tx,
        order.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      );
      return tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELLED,
          cancellationReason: reason,
          ...this.statusTimestamp(OrderStatus.CANCELLED),
          statusHistory: {
            create: { status: OrderStatus.CANCELLED, changedById: actorId, note: reason },
          },
        },
        include: ORDER_INCLUDE,
      });
    });

    this.events.emitOrderStatus(orderId, { orderId, status: updated.status });
    await this.notifyCustomer(updated, `Your order was cancelled: ${reason}`);
    return updated;
  }

  private async applyStatus(
    orderId: string,
    status: OrderStatus,
    actorId: string | null,
    note: string,
  ) {
    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        ...this.statusTimestamp(status),
        statusHistory: { create: { status, changedById: actorId, note } },
      },
      include: ORDER_INCLUDE,
    });
    this.events.emitOrderStatus(orderId, { orderId, status: updated.status });
    return updated;
  }

  private async requireRiderOrder(orderId: string, riderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, riderId, deletedAt: null },
    });
    if (!order) throw new NotFoundException('Order not found or not assigned to you');
    return order;
  }

  private async notifyCustomer(order: Order, body: string) {
    await this.notifications.dispatch({
      userId: order.userId,
      type: NotificationType.ORDER_UPDATE,
      title: `Order ${order.orderNumber}`,
      body,
      data: { orderId: order.id, status: order.status },
    });
  }
}
