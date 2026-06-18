/**
 * Drives a customer order through its full delivery lifecycle against the LIVE
 * running API, so the customer app receives real WebSocket updates (status +
 * rider location) — useful for validating tracking before the Rider app exists.
 *
 * Prereqs: the API must be running locally; the order must already exist
 * (place it from the customer app). Then:
 *
 *   ORDER_ID=<uuid> npm run simulate
 *
 * Optional env: API_URL (default http://localhost:3000), STEP_MS (default 3000).
 */
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('dotenv').config();
} catch {
  /* env provided externally */
}

import { PrismaClient, RiderStatus, UserRole } from '@prisma/client';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const API = `${process.env.API_URL ?? 'http://localhost:3000'}/api/v1`;
const STEP_MS = parseInt(process.env.STEP_MS ?? '3000', 10);
const JWT_SECRET = process.env.JWT_SECRET as string;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function mintAccess(payload: Record<string, unknown>): string {
  return jwt.sign({ ...payload, type: 'access' }, JWT_SECRET, { expiresIn: '1h' });
}

async function call(method: string, path: string, token: string, body?: unknown): Promise<void> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  console.log(`  ${method} ${path} -> ${res.status}${res.ok ? '' : ' ' + text.slice(0, 200)}`);
  if (!res.ok) throw new Error(`Step failed: ${method} ${path}`);
}

async function main(): Promise<void> {
  const orderId = process.env.ORDER_ID;
  if (!orderId) throw new Error('Set ORDER_ID=<uuid> (place an order from the app first).');
  if (!JWT_SECRET) throw new Error('JWT_SECRET missing from env (.env).');

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error(`Order ${orderId} not found.`);
  console.log(`Simulating order ${order.orderNumber} (status ${order.status})`);

  // Ensure a verified rider + an admin actor exist.
  const adminUser = await prisma.user.upsert({
    where: { phone: '+910000000090' },
    update: { role: UserRole.SUPER_ADMIN, deletedAt: null, isActive: true },
    create: { phone: '+910000000090', name: 'Sim Admin', role: UserRole.SUPER_ADMIN },
  });
  const riderUser = await prisma.user.upsert({
    where: { phone: '+910000000091' },
    update: { role: UserRole.RIDER, deletedAt: null, isActive: true },
    create: { phone: '+910000000091', name: 'Sim Rider', role: UserRole.RIDER },
  });
  const rider = await prisma.rider.upsert({
    where: { userId: riderUser.id },
    update: { isVerified: true, status: RiderStatus.ONLINE, deletedAt: null },
    create: {
      userId: riderUser.id,
      isVerified: true,
      status: RiderStatus.ONLINE,
      vehicleType: 'Bike',
      vehicleNumber: 'TS01-SIM',
    },
  });

  const adminToken = mintAccess({ sub: adminUser.id, phone: adminUser.phone, role: 'SUPER_ADMIN' });
  const riderToken = mintAccess({ sub: riderUser.id, phone: riderUser.phone, role: 'RIDER', riderId: rider.id });

  const destLat = order.deliveryLatitude ?? 17.6688;
  const destLng = order.deliveryLongitude ?? 80.8936;
  // Start ~2 km away and approach the drop point.
  const startLat = destLat + 0.02;
  const startLng = destLng + 0.015;

  console.log('1) Admin assigns rider...');
  await call('POST', `/orders/${orderId}/assign`, adminToken, { riderId: rider.id });
  await sleep(STEP_MS);

  console.log('2) Rider accepts...');
  await call('POST', `/orders/${orderId}/accept`, riderToken);
  await sleep(STEP_MS);

  console.log('3) Rider picks up...');
  await call('POST', `/orders/${orderId}/pickup`, riderToken);
  await sleep(STEP_MS);

  console.log('4) Out for delivery...');
  await call('POST', `/orders/${orderId}/out-for-delivery`, riderToken);

  console.log('5) Feeding live rider locations...');
  const steps = 8;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lat = startLat + (destLat - startLat) * t;
    const lng = startLng + (destLng - startLng) * t;
    await call('POST', '/riders/me/location', riderToken, { latitude: lat, longitude: lng });
    await sleep(STEP_MS);
  }

  console.log('6) Delivered (COD collected)...');
  await call('POST', `/orders/${orderId}/deliver`, riderToken);

  console.log('Simulation complete.');
}

main()
  .catch((e) => {
    console.error(`✗ ${(e as Error).message}`);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
