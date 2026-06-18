/* eslint-disable */
/**
 * Local validation helper (NOT for production). Simulates the admin actions that
 * the Phase 4 Admin Dashboard will own, so the rider app can be exercised
 * end-to-end on the emulator before that dashboard exists.
 *
 * Usage (from services/api):
 *   node scripts/test-rider-helper.js info   <phone>
 *   node scripts/test-rider-helper.js verify <phone>
 */
try { require('dotenv').config(); } catch {}
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const [cmd, phone = '+919000000002'] = process.argv.slice(2);

  if (cmd === 'orders') {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' }, take: 10,
      select: { id: true, orderNumber: true, status: true, riderId: true, userId: true, total: true, deliveryFee: true, addressId: true, deliveryLatitude: true, deliveryLongitude: true },
    });
    console.log(JSON.stringify(orders, null, 2));
    return;
  }
  if (cmd === 'admin-check') {
    const jwtLib = require('jsonwebtoken');
    const admin = await prisma.user.findFirst({ where: { phone: '+910000000090' } }) || await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
    const token = jwtLib.sign(
      { sub: admin.id, phone: admin.phone, role: admin.role, riderId: null, type: 'access' },
      process.env.JWT_SECRET, { expiresIn: '1h' },
    );
    const hit = async (path, method = 'GET', body) => {
      const res = await fetch(`http://localhost:3000/api/v1${path}`, {
        method,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = await res.json().catch(() => ({}));
      return { path, status: res.status, keys: json?.data ? (Array.isArray(json.data) ? `array(${json.data.length})` : Object.keys(json.data)) : json };
    };
    const broadcast = await hit('/notifications/broadcast', 'POST', { type: 'PROMOTION', title: 'Smoke test', body: 'Admin dashboard validation broadcast' });
    console.log(JSON.stringify({
      dashboard: await hit('/admin/dashboard'),
      analytics: await hit('/admin/analytics?days=7'),
      orders: await hit('/orders/admin/all?page=1&pageSize=2&status=DELIVERED'),
      usersByRole: await hit('/users?page=1&pageSize=2&role=CUSTOMER'),
      ridersByStatus: await hit('/riders?page=1&pageSize=2&status=ONLINE'),
      products: await hit('/products?page=1&pageSize=2&serviceType=GROCERY'),
      categories: await hit('/categories?serviceType=GROCERY'),
      lowStock: await hit('/inventory/low-stock'),
      pendingRx: await hit('/prescriptions/pending'),
      admins: await hit('/admin/admins'),
      settings: await hit('/settings'),
      broadcast,
      notificationHistory: await hit('/audit-logs?entityType=Notification&page=1&pageSize=3'),
    }, null, 2));
    return;
  }

  if (cmd === 'admins') {
    const admins = await prisma.user.findMany({ where: { role: { in: ['ADMIN', 'SUPER_ADMIN', 'SUPPORT'] } }, select: { id: true, name: true, phone: true, role: true } });
    console.log(JSON.stringify(admins, null, 2));
    return;
  }

  // Seeds a PENDING order and assigns it to the rider via the REAL assign endpoint
  // (so the WebSocket order:assigned event + FCM dispatch fire). Admin auth is a
  // directly-signed JWT (we hold JWT_SECRET) — stands in for the Phase 4 dashboard.
  if (cmd === 'assign-test') {
    const jwtLib = require('jsonwebtoken');
    const rUser = await prisma.user.findFirst({ where: { phone } });
    const rRider = await prisma.rider.findFirst({ where: { userId: rUser.id, deletedAt: null } });
    if (!rRider) throw new Error('rider not found');
    const template = await prisma.order.findFirst({ orderBy: { createdAt: 'desc' } });
    if (!template) throw new Error('need an existing order to copy customer/address from');
    const product = await prisma.product.findFirst({ where: { deletedAt: null } });
    const orderNumber = `KK-G-TEST-${Date.now().toString().slice(-6)}`;
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: template.userId,
        addressId: template.addressId,
        serviceType: 'GROCERY',
        status: 'PENDING',
        paymentMethod: 'COD',
        subtotal: 90, deliveryFee: 25, total: 115,
        deliveryLatitude: 17.6701841, deliveryLongitude: 80.8935093,
        notes: 'Rider validation test order',
        items: product ? { create: [{ productId: product.id, productName: product.name, unitPrice: 90, quantity: 1, total: 90 }] } : undefined,
        statusHistory: { create: { status: 'PENDING', note: 'Seed for rider test' } },
      },
    });
    const admin = await prisma.user.findFirst({ where: { phone: '+910000000090' } }) || await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
    const token = jwtLib.sign(
      { sub: admin.id, phone: admin.phone, role: admin.role, riderId: null, type: 'access' },
      process.env.JWT_SECRET, { expiresIn: '1h' },
    );
    const res = await fetch(`http://localhost:3000/api/v1/orders/${order.id}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ riderId: rRider.id }),
    });
    const json = await res.json().catch(() => ({}));
    console.log(JSON.stringify({ httpOk: res.ok, httpStatus: res.status, orderId: order.id, orderNumber, riderId: rRider.id, response: json?.data ? { status: json.data.status, orderNumber: json.data.orderNumber } : json }, null, 2));
    return;
  }

  // Walks the rider's current active order through the remaining lifecycle using a
  // directly-signed RIDER token, hitting the same endpoints the app's buttons call.
  if (cmd === 'deliver-flow') {
    const jwtLib = require('jsonwebtoken');
    const rUser = await prisma.user.findFirst({ where: { phone } });
    const rRider = await prisma.rider.findFirst({ where: { userId: rUser.id, deletedAt: null } });
    const order = await prisma.order.findFirst({
      where: { riderId: rRider.id, status: { in: ['ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'OUT_FOR_DELIVERY'] }, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (!order) throw new Error('No active order for this rider');
    const token = jwtLib.sign(
      { sub: rUser.id, phone: rUser.phone, role: 'RIDER', riderId: rRider.id, type: 'access' },
      process.env.JWT_SECRET, { expiresIn: '1h' },
    );
    const base = `http://localhost:3000/api/v1/orders/${order.id}`;
    const call = async (path) => {
      const res = await fetch(`${base}/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: '{}' });
      const json = await res.json().catch(() => ({}));
      return { path, httpStatus: res.status, status: json?.data?.status || json?.message || json };
    };
    const plan = { ASSIGNED: ['accept', 'pickup', 'out-for-delivery', 'deliver'], ACCEPTED: ['pickup', 'out-for-delivery', 'deliver'], PICKED_UP: ['out-for-delivery', 'deliver'], OUT_FOR_DELIVERY: ['deliver'] }[order.status];
    const results = [];
    for (const step of plan) { results.push(await call(step)); }
    console.log(JSON.stringify({ orderId: order.id, orderNumber: order.orderNumber, from: order.status, steps: results }, null, 2));
    return;
  }

  const user = await prisma.user.findFirst({ where: { phone } });
  if (!user) throw new Error(`No user for ${phone}`);
  const rider = await prisma.rider.findFirst({ where: { userId: user.id, deletedAt: null } });

  if (cmd === 'verify') {
    if (!rider) throw new Error('User has no rider profile yet');
    const updated = await prisma.rider.update({ where: { id: rider.id }, data: { isVerified: true } });
    console.log(JSON.stringify({ action: 'verify', userId: user.id, riderId: rider.id, isVerified: updated.isVerified, role: user.role }, null, 2));
    return;
  }

  // default: info
  console.log(JSON.stringify({
    userId: user.id,
    name: user.name,
    phone: user.phone,
    role: user.role,
    fcmToken: user.fcmToken ? `${user.fcmToken.slice(0, 24)}… (len ${user.fcmToken.length})` : null,
    rider: rider && { riderId: rider.id, vehicleType: rider.vehicleType, vehicleNumber: rider.vehicleNumber, isVerified: rider.isVerified, status: rider.status, lastLocationAt: rider.lastLocationAt },
  }, null, 2));
}

main().catch((e) => { console.error('✗', e.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
