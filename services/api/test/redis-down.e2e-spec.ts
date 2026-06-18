import request from 'supertest';
import { OrderStatus, ServiceType, UserRole } from '../src/common/enums';
import { accessTokenFor, createTestApp, resetDb, TestContext } from './test-app';

/**
 * Graceful degradation: with Redis unreachable, authentication, catalogue reads
 * and COD order placement must still succeed. PostgreSQL is the source of truth;
 * Redis (cache / rate-limit / queue) is best-effort only.
 */
describe('Redis outage degradation (e2e)', () => {
  let ctx: TestContext;
  let http: ReturnType<typeof request>;
  let token: string;
  let productId: string;
  let addressId: string;
  const originalRedis = process.env.REDIS_URL;

  beforeAll(async () => {
    // Point at a port with nothing listening BEFORE the app is constructed.
    process.env.REDIS_URL = 'redis://127.0.0.1:6399';

    ctx = await createTestApp();
    http = request(ctx.app.getHttpServer());
    await resetDb(ctx.prisma);

    const customer = await ctx.prisma.user.create({
      data: { phone: '+919200000001', role: UserRole.CUSTOMER },
    });
    const category = await ctx.prisma.category.create({
      data: { name: 'Down Veg', slug: 'down-veg', serviceType: ServiceType.GROCERY },
    });
    const product = await ctx.prisma.product.create({
      data: {
        name: 'Potato 1kg',
        slug: 'potato-1kg-down',
        sku: 'DOWN-POT-1KG',
        categoryId: category.id,
        serviceType: ServiceType.GROCERY,
        price: 20,
        mrp: 25,
        inventory: { create: { quantity: 10, isInStock: true } },
      },
    });
    productId = product.id;
    const address = await ctx.prisma.address.create({
      data: {
        userId: customer.id,
        line1: 'Down St',
        pincode: '507111',
        latitude: 17.66,
        longitude: 80.89,
      },
    });
    addressId = address.id;

    // Token issuance writes a refresh row to PG (authoritative) + best-effort Redis cache.
    token = await accessTokenFor(ctx, {
      id: customer.id,
      phone: customer.phone,
      role: UserRole.CUSTOMER,
    });
  });

  afterAll(async () => {
    await resetDb(ctx.prisma);
    await ctx.app.close();
    process.env.REDIS_URL = originalRedis;
  });

  const auth = () => ({ Authorization: `Bearer ${token}` });

  it('stays live but reports not-ready when Redis is down', async () => {
    // Liveness = process is up; must remain 200 during a Redis outage.
    await http.get('/api/v1/health/live').expect(200);
    // Readiness = dependencies healthy; Redis down → 503 (correctly degraded, no hang/crash).
    const ready = await http.get('/api/v1/health/ready');
    expect(ready.status).toBe(503);
  });

  it('serves public catalogue reads with Redis down', async () => {
    const res = await http.get('/api/v1/products?serviceType=GROCERY').expect(200);
    expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
  });

  it('authenticates (JWT + DB) with Redis down', async () => {
    const res = await http.get('/api/v1/auth/me').set(auth()).expect(200);
    expect(res.body.data.phone).toBe('+919200000001');
  });

  it('places a COD order with Redis down (Postgres is source of truth)', async () => {
    const res = await http
      .post('/api/v1/orders')
      .set(auth())
      .send({ addressId, serviceType: 'GROCERY', items: [{ productId, quantity: 1 }] })
      .expect(201);
    expect(res.body.data.status).toBe(OrderStatus.PENDING);

    const order = await ctx.prisma.order.findUnique({ where: { id: res.body.data.id } });
    expect(order).toBeTruthy();
    const inv = await ctx.prisma.inventory.findUnique({ where: { productId } });
    expect(inv?.quantity).toBe(9);
  });
});
