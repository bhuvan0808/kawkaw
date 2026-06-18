import request from 'supertest';
import {
  OrderStatus,
  PaymentStatus,
  RiderStatus,
  ServiceType,
  UserRole,
} from '../src/common/enums';
import { accessTokenFor, createTestApp, resetDb, TestContext } from './test-app';

/**
 * Full Cash-On-Delivery lifecycle against an isolated test schema, asserting
 * the database state after every step. This is the "is the backend really
 * ready?" test: login (token) → browse → address → checkout → assign → accept
 * → pickup → out-for-delivery → deliver, plus stock/payment/earnings effects.
 */
describe('COD order lifecycle (e2e)', () => {
  let ctx: TestContext;
  let http: ReturnType<typeof request>;

  let customerToken: string;
  let adminToken: string;
  let riderToken: string;
  let riderId: string;
  let productId: string;
  let addressId: string;
  let orderId: string;

  beforeAll(async () => {
    ctx = await createTestApp();
    http = request(ctx.app.getHttpServer());
    await resetDb(ctx.prisma);

    // --- Seed identities & catalogue (the only "given") -------------------
    const customer = await ctx.prisma.user.create({
      data: { phone: '+919000000001', role: UserRole.CUSTOMER },
    });
    const adminUser = await ctx.prisma.user.create({
      data: { phone: '+919000000002', role: UserRole.SUPER_ADMIN },
    });
    const riderUser = await ctx.prisma.user.create({
      data: { phone: '+919000000003', role: UserRole.RIDER },
    });
    const rider = await ctx.prisma.rider.create({
      data: { userId: riderUser.id, status: RiderStatus.ONLINE, isVerified: true },
    });
    riderId = rider.id;

    const category = await ctx.prisma.category.create({
      data: { name: 'Test Veg', slug: 'test-veg', serviceType: ServiceType.GROCERY },
    });
    const product = await ctx.prisma.product.create({
      data: {
        name: 'Tomato 1kg',
        slug: 'tomato-1kg-e2e',
        sku: 'E2E-TOM-1KG',
        categoryId: category.id,
        serviceType: ServiceType.GROCERY,
        price: 30,
        mrp: 35,
        inventory: { create: { quantity: 10, isInStock: true } },
      },
    });
    productId = product.id;

    customerToken = await accessTokenFor(ctx, {
      id: customer.id,
      phone: customer.phone,
      role: UserRole.CUSTOMER,
    });
    adminToken = await accessTokenFor(ctx, {
      id: adminUser.id,
      phone: adminUser.phone,
      role: UserRole.SUPER_ADMIN,
    });
    riderToken = await accessTokenFor(ctx, {
      id: riderUser.id,
      phone: riderUser.phone,
      role: UserRole.RIDER,
    });
  });

  afterAll(async () => {
    await resetDb(ctx.prisma);
    await ctx.app.close();
  });

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  it('1. browses products (public)', async () => {
    const res = await http.get('/api/v1/products?serviceType=GROCERY').expect(200);
    expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
  });

  it('2. adds a delivery address', async () => {
    const res = await http
      .post('/api/v1/addresses')
      .set(auth(customerToken))
      .send({ line1: 'H.No 1-2-3', pincode: '507111', latitude: 17.6688, longitude: 80.8936 })
      .expect(201);
    addressId = res.body.data.id;
    expect(res.body.data.isDefault).toBe(true);
  });

  it('3. places a COD order → PENDING, stock decremented, history recorded', async () => {
    const res = await http
      .post('/api/v1/orders')
      .set(auth(customerToken))
      .send({
        addressId,
        serviceType: 'GROCERY',
        items: [{ productId, quantity: 2 }],
      })
      .expect(201);
    orderId = res.body.data.id;
    expect(res.body.data.status).toBe(OrderStatus.PENDING);
    expect(Number(res.body.data.subtotal)).toBe(60);

    const inv = await ctx.prisma.inventory.findUnique({ where: { productId } });
    expect(inv?.quantity).toBe(8); // 10 - 2
    const history = await ctx.prisma.orderStatusHistory.findMany({ where: { orderId } });
    expect(history.map((h) => h.status)).toContain(OrderStatus.PENDING);
  });

  it('rejects an over-quantity order with 409 (insufficient stock)', async () => {
    // 50 is within the DTO max (100) but exceeds the 8 units left after step 3.
    await http
      .post('/api/v1/orders')
      .set(auth(customerToken))
      .send({ addressId, serviceType: 'GROCERY', items: [{ productId, quantity: 50 }] })
      .expect(409);
  });

  it('4. admin assigns a rider → ASSIGNED', async () => {
    const res = await http
      .post(`/api/v1/orders/${orderId}/assign`)
      .set(auth(adminToken))
      .send({ riderId })
      .expect(201);
    expect(res.body.data.status).toBe(OrderStatus.ASSIGNED);

    const order = await ctx.prisma.order.findUnique({ where: { id: orderId } });
    expect(order?.riderId).toBe(riderId);
    expect(order?.assignedAt).toBeTruthy();
  });

  it('5. rider accepts → ACCEPTED', async () => {
    const res = await http
      .post(`/api/v1/orders/${orderId}/accept`)
      .set(auth(riderToken))
      .expect(201);
    expect(res.body.data.status).toBe(OrderStatus.ACCEPTED);
  });

  it('6. rider picks up → PICKED_UP', async () => {
    const res = await http
      .post(`/api/v1/orders/${orderId}/pickup`)
      .set(auth(riderToken))
      .expect(201);
    expect(res.body.data.status).toBe(OrderStatus.PICKED_UP);
  });

  it('7. rider goes out for delivery → OUT_FOR_DELIVERY', async () => {
    const res = await http
      .post(`/api/v1/orders/${orderId}/out-for-delivery`)
      .set(auth(riderToken))
      .expect(201);
    expect(res.body.data.status).toBe(OrderStatus.OUT_FOR_DELIVERY);
  });

  it('8. rider delivers → DELIVERED, COD collected, rider stats updated', async () => {
    const res = await http
      .post(`/api/v1/orders/${orderId}/deliver`)
      .set(auth(riderToken))
      .expect(201);
    expect(res.body.data.status).toBe(OrderStatus.DELIVERED);

    const order = await ctx.prisma.order.findUnique({ where: { id: orderId } });
    expect(order?.paymentStatus).toBe(PaymentStatus.COLLECTED);
    expect(order?.deliveredAt).toBeTruthy();

    const rider = await ctx.prisma.rider.findUnique({ where: { id: riderId } });
    expect(rider?.totalDeliveries).toBe(1);
    expect(Number(rider?.totalEarnings)).toBe(Number(order?.deliveryFee));
  });

  it('forbids cancelling a delivered order (lifecycle guard)', async () => {
    await http
      .post(`/api/v1/orders/${orderId}/cancel`)
      .set(auth(customerToken))
      .send({ reason: 'too late' })
      .expect(400);
  });

  it('enforces RBAC: customer cannot assign riders', async () => {
    await http
      .post(`/api/v1/orders/${orderId}/assign`)
      .set(auth(customerToken))
      .send({ riderId })
      .expect(403);
  });

  it('rejects unauthenticated access', async () => {
    await http.get('/api/v1/orders').expect(401);
  });
});
