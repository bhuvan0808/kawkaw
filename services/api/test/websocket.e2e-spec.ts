import { AddressInfo } from 'net';
import { io, Socket } from 'socket.io-client';
import { OrderStatus, RiderStatus, ServiceType, UserRole, WS_EVENTS } from '../src/common/enums';
import { OrdersService } from '../src/modules/orders/orders.service';
import { accessTokenFor, createTestApp, resetDb, TestContext } from './test-app';

/**
 * Verifies that order lifecycle changes are pushed to subscribed realtime
 * clients over Socket.IO (handshake authenticated by JWT).
 */
describe('Realtime order events (e2e)', () => {
  let ctx: TestContext;
  let orders: OrdersService;
  let port: number;
  let customerToken: string;
  let socket: Socket;
  let orderId: string;
  let riderId: string;

  beforeAll(async () => {
    ctx = await createTestApp();
    await ctx.app.listen(0);
    port = (ctx.app.getHttpServer().address() as AddressInfo).port;
    orders = ctx.app.get(OrdersService);
    await resetDb(ctx.prisma);

    const customer = await ctx.prisma.user.create({
      data: { phone: '+919100000001', role: UserRole.CUSTOMER },
    });
    const riderUser = await ctx.prisma.user.create({
      data: { phone: '+919100000003', role: UserRole.RIDER },
    });
    const rider = await ctx.prisma.rider.create({
      data: { userId: riderUser.id, status: RiderStatus.ONLINE, isVerified: true },
    });
    riderId = rider.id;

    const category = await ctx.prisma.category.create({
      data: { name: 'WS Veg', slug: 'ws-veg', serviceType: ServiceType.GROCERY },
    });
    const product = await ctx.prisma.product.create({
      data: {
        name: 'Onion 1kg',
        slug: 'onion-1kg-ws',
        sku: 'WS-ONI-1KG',
        categoryId: category.id,
        serviceType: ServiceType.GROCERY,
        price: 25,
        mrp: 30,
        inventory: { create: { quantity: 10, isInStock: true } },
      },
    });
    const address = await ctx.prisma.address.create({
      data: {
        userId: customer.id,
        line1: 'WS St',
        pincode: '507111',
        latitude: 17.66,
        longitude: 80.89,
      },
    });

    const order = await orders.create(customer.id, {
      addressId: address.id,
      serviceType: ServiceType.GROCERY,
      items: [{ productId: product.id, quantity: 1 }],
    });
    orderId = order.id;

    customerToken = await accessTokenFor(ctx, {
      id: customer.id,
      phone: customer.phone,
      role: UserRole.CUSTOMER,
    });
  });

  afterAll(async () => {
    if (socket?.connected) socket.disconnect();
    await resetDb(ctx.prisma);
    await ctx.app.close();
  });

  it('rejects a socket connection without a token', async () => {
    const bad = io(`http://127.0.0.1:${port}/realtime`, {
      transports: ['websocket'],
      reconnection: false,
    });
    // A tokenless socket may briefly connect at the transport level; the gateway
    // then disconnects it. Assert it ends up NOT connected.
    const rejected = await new Promise<boolean>((resolve) => {
      bad.on('disconnect', () => resolve(true));
      bad.on('connect_error', () => resolve(true));
      setTimeout(() => resolve(!bad.connected), 4000);
    });
    bad.close();
    expect(rejected).toBe(true);
  });

  it('delivers order:status_changed to a subscribed client when a rider is assigned', async () => {
    socket = io(`http://127.0.0.1:${port}/realtime`, {
      transports: ['websocket'],
      auth: { token: customerToken },
      reconnection: false,
    });

    await new Promise<void>((resolve, reject) => {
      socket.on('connect', () => resolve());
      socket.on('connect_error', (e) => reject(e));
      setTimeout(() => reject(new Error('socket connect timeout')), 8000);
    });

    // Join the order room (handler acks with { joined }).
    await new Promise<void>((resolve, reject) => {
      socket.emit('order:subscribe', { orderId }, (ack: { joined: string }) => {
        ack?.joined ? resolve() : reject(new Error('subscribe failed'));
      });
      setTimeout(() => reject(new Error('subscribe ack timeout')), 5000);
    });

    const eventPromise = new Promise<any>((resolve, reject) => {
      socket.on(WS_EVENTS.ORDER_STATUS_CHANGED, (payload) => resolve(payload));
      setTimeout(() => reject(new Error('did not receive order:status_changed')), 8000);
    });

    // Trigger a lifecycle change server-side.
    await orders.assignRider(orderId, riderId);

    const payload = await eventPromise;
    expect(payload.orderId).toBe(orderId);
    expect(payload.status).toBe(OrderStatus.ASSIGNED);
  });
});
