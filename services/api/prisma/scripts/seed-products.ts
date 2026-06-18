/**
 * Seeds a starter catalogue of REAL products (not mock filler) so the apps can
 * be exercised end-to-end. Idempotent (upsert by SKU). Safe to re-run.
 *
 *   npm run db:seed:products
 */
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('dotenv').config();
} catch {
  /* env provided externally */
}

import { PrismaClient, ServiceType } from '@prisma/client';

const prisma = new PrismaClient();

interface Seed {
  name: string;
  categorySlug: string;
  service: ServiceType;
  sku: string;
  price: number;
  mrp: number;
  unit: string;
  stock: number;
  featured?: boolean;
  rx?: boolean;
}

const PRODUCTS: Seed[] = [
  // Grocery — Fruits & Vegetables
  { name: 'Tomato', categorySlug: 'fruits-vegetables', service: ServiceType.GROCERY, sku: 'GRO-VEG-TOMATO-1KG', price: 30, mrp: 40, unit: '1 kg', stock: 200, featured: true },
  { name: 'Onion', categorySlug: 'fruits-vegetables', service: ServiceType.GROCERY, sku: 'GRO-VEG-ONION-1KG', price: 35, mrp: 45, unit: '1 kg', stock: 200 },
  { name: 'Potato', categorySlug: 'fruits-vegetables', service: ServiceType.GROCERY, sku: 'GRO-VEG-POTATO-1KG', price: 28, mrp: 35, unit: '1 kg', stock: 200 },
  { name: 'Banana (Robusta)', categorySlug: 'fruits-vegetables', service: ServiceType.GROCERY, sku: 'GRO-FRT-BANANA-DOZEN', price: 50, mrp: 60, unit: '1 dozen', stock: 120, featured: true },
  // Grocery — Dairy & Eggs
  { name: 'Toned Milk', categorySlug: 'dairy-eggs', service: ServiceType.GROCERY, sku: 'GRO-DRY-MILK-500ML', price: 27, mrp: 30, unit: '500 ml', stock: 150, featured: true },
  { name: 'Farm Eggs', categorySlug: 'dairy-eggs', service: ServiceType.GROCERY, sku: 'GRO-DRY-EGGS-6', price: 42, mrp: 54, unit: '6 pcs', stock: 100 },
  { name: 'Curd', categorySlug: 'dairy-eggs', service: ServiceType.GROCERY, sku: 'GRO-DRY-CURD-400G', price: 35, mrp: 40, unit: '400 g', stock: 80 },
  // Grocery — Staples & Grains
  { name: 'Sona Masoori Rice', categorySlug: 'staples-grains', service: ServiceType.GROCERY, sku: 'GRO-STP-RICE-5KG', price: 320, mrp: 380, unit: '5 kg', stock: 60, featured: true },
  { name: 'Whole Wheat Atta', categorySlug: 'staples-grains', service: ServiceType.GROCERY, sku: 'GRO-STP-ATTA-5KG', price: 240, mrp: 290, unit: '5 kg', stock: 60 },
  { name: 'Toor Dal', categorySlug: 'staples-grains', service: ServiceType.GROCERY, sku: 'GRO-STP-TOORDAL-1KG', price: 145, mrp: 170, unit: '1 kg', stock: 90 },
  // Pharmacy — Medicines / Wellness
  { name: 'Paracetamol 500mg (Strip of 10)', categorySlug: 'medicines', service: ServiceType.PHARMACY, sku: 'PHA-MED-PARA-500', price: 18, mrp: 22, unit: '10 tablets', stock: 300 },
  { name: 'Amoxicillin 500mg (Strip of 10)', categorySlug: 'medicines', service: ServiceType.PHARMACY, sku: 'PHA-MED-AMOX-500', price: 85, mrp: 105, unit: '10 capsules', stock: 120, rx: true },
  { name: 'Hand Sanitizer', categorySlug: 'wellness-healthcare', service: ServiceType.PHARMACY, sku: 'PHA-WEL-SANITIZER-200ML', price: 60, mrp: 80, unit: '200 ml', stock: 150, featured: true },
  { name: 'Digital Thermometer', categorySlug: 'wellness-healthcare', service: ServiceType.PHARMACY, sku: 'PHA-WEL-THERMO', price: 199, mrp: 299, unit: '1 unit', stock: 40 },
  // Food
  { name: 'Veg Thali', categorySlug: 'meals', service: ServiceType.FOOD, sku: 'FOOD-MEAL-VEGTHALI', price: 120, mrp: 140, unit: '1 plate', stock: 50, featured: true },
  { name: 'Chicken Biryani', categorySlug: 'meals', service: ServiceType.FOOD, sku: 'FOOD-MEAL-CHKBIRYANI', price: 180, mrp: 220, unit: '1 plate', stock: 50, featured: true },
  { name: 'Masala Chai', categorySlug: 'beverages-desserts', service: ServiceType.FOOD, sku: 'FOOD-BEV-CHAI', price: 15, mrp: 20, unit: '1 cup', stock: 200 },
  { name: 'Gulab Jamun (2 pcs)', categorySlug: 'beverages-desserts', service: ServiceType.FOOD, sku: 'FOOD-DST-GULABJAMUN', price: 40, mrp: 50, unit: '2 pcs', stock: 80 },
];

function slugify(input: string): string {
  return input.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/[\s_-]+/g, '-');
}

async function main(): Promise<void> {
  let created = 0;
  let skipped = 0;
  for (const p of PRODUCTS) {
    const category = await prisma.category.findFirst({
      where: { slug: p.categorySlug, deletedAt: null },
    });
    if (!category) {
      console.warn(`! Category '${p.categorySlug}' not found — run the main seed first. Skipping ${p.name}.`);
      skipped++;
      continue;
    }
    const existing = await prisma.product.findUnique({ where: { sku: p.sku } });
    if (existing) {
      skipped++;
      continue;
    }
    await prisma.product.create({
      data: {
        name: p.name,
        slug: `${slugify(p.name)}-${p.sku.toLowerCase()}`,
        sku: p.sku,
        categoryId: category.id,
        serviceType: p.service,
        price: p.price,
        mrp: p.mrp,
        unit: p.unit,
        isActive: true,
        isFeatured: p.featured ?? false,
        requiresPrescription: p.rx ?? false,
        inventory: { create: { quantity: p.stock, isInStock: p.stock > 0 } },
      },
    });
    created++;
  }
  console.log(`Products seeded: ${created} created, ${skipped} already present.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
