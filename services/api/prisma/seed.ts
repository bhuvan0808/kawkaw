/**
 * Reference-data seed: platform settings + a starter set of real operational
 * categories. No demo/mock orders or products, and NO admin accounts — admins
 * are created out-of-band via `npm run admin:create` (see prisma/scripts).
 *
 * Run with: npm run db:seed
 */
import { PrismaClient, ServiceType } from '@prisma/client';

const prisma = new PrismaClient();

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-');
}

const SETTINGS: Array<{ key: string; value: unknown; description: string; category: string; isPublic: boolean }> = [
  { key: 'delivery_fee', value: 20, description: 'Flat delivery fee (₹)', category: 'orders', isPublic: true },
  { key: 'free_delivery_above', value: 499, description: 'Free delivery above this subtotal (₹)', category: 'orders', isPublic: true },
  { key: 'tax_percent', value: 0, description: 'Tax percentage applied to subtotal', category: 'orders', isPublic: true },
  { key: 'parcel_base_fee', value: 30, description: 'Parcel base fee (₹)', category: 'parcels', isPublic: true },
  { key: 'parcel_per_km', value: 8, description: 'Parcel per-km fee (₹)', category: 'parcels', isPublic: true },
  { key: 'store_open', value: true, description: 'Whether the store is accepting orders', category: 'general', isPublic: true },
  { key: 'service_radius_km', value: 8, description: 'Max delivery radius (km)', category: 'delivery', isPublic: true },
  { key: 'launch_city', value: 'Bhadrachalam', description: 'Launch city', category: 'general', isPublic: true },
];

const CATEGORIES: Array<{ name: string; serviceType: ServiceType; sortOrder: number }> = [
  { name: 'Fruits & Vegetables', serviceType: ServiceType.GROCERY, sortOrder: 1 },
  { name: 'Dairy & Eggs', serviceType: ServiceType.GROCERY, sortOrder: 2 },
  { name: 'Staples & Grains', serviceType: ServiceType.GROCERY, sortOrder: 3 },
  { name: 'Snacks & Beverages', serviceType: ServiceType.GROCERY, sortOrder: 4 },
  { name: 'Household & Cleaning', serviceType: ServiceType.GROCERY, sortOrder: 5 },
  { name: 'Medicines', serviceType: ServiceType.PHARMACY, sortOrder: 1 },
  { name: 'Wellness & Healthcare', serviceType: ServiceType.PHARMACY, sortOrder: 2 },
  { name: 'Baby Care', serviceType: ServiceType.PHARMACY, sortOrder: 3 },
  { name: 'Meals', serviceType: ServiceType.FOOD, sortOrder: 1 },
  { name: 'Snacks & Tiffins', serviceType: ServiceType.FOOD, sortOrder: 2 },
  { name: 'Beverages & Desserts', serviceType: ServiceType.FOOD, sortOrder: 3 },
];

async function main(): Promise<void> {
  console.log('Seeding platform settings...');
  for (const s of SETTINGS) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: {},
      create: {
        key: s.key,
        value: s.value as object,
        description: s.description,
        category: s.category,
        isPublic: s.isPublic,
      },
    });
  }

  console.log('Seeding starter categories...');
  for (const c of CATEGORIES) {
    const slug = slugify(c.name);
    await prisma.category.upsert({
      where: { slug },
      update: {},
      create: { name: c.name, slug, serviceType: c.serviceType, sortOrder: c.sortOrder, isActive: true },
    });
  }

  console.log('Seed complete. (Create an admin with: npm run admin:create)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
