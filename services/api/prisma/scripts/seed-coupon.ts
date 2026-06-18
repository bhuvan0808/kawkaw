/**
 * Seeds a sample coupon so the checkout coupon flow can be tested.
 *   npm run db:seed:coupon
 */
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('dotenv').config();
} catch {
  /* env provided externally */
}

import { CouponType, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const code = 'WELCOME50';
  const existing = await prisma.coupon.findUnique({ where: { code } });
  if (existing) {
    console.log(`Coupon ${code} already exists.`);
    return;
  }
  await prisma.coupon.create({
    data: {
      code,
      type: CouponType.FIXED,
      value: 50,
      minOrderValue: 99,
      perUserLimit: 5,
      isActive: true,
    },
  });
  console.log(`Created coupon ${code}: ₹50 off on orders over ₹99 (up to 5 uses/customer).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
