/**
 * Bootstrap / manage an admin account. This is the ONLY supported way to create
 * the first SUPER_ADMIN — it is never seeded automatically and no admin is ever
 * hardcoded. Run as a one-off ops task with DATABASE_URL set.
 *
 * Usage:
 *   ADMIN_PHONE=+919999999999 ADMIN_ROLE=SUPER_ADMIN ADMIN_NAME="Founder" npm run admin:create
 *
 * ADMIN_ROLE ∈ { SUPER_ADMIN (default), ADMIN, SUPPORT }.
 * Idempotent: re-running updates the existing user's role/profile.
 */
try {
  // Load .env if present (no hard dependency: ignore if dotenv is unavailable).
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('dotenv').config();
} catch {
  /* env already provided by the environment */
}

import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const phone = process.env.ADMIN_PHONE?.trim();
  const roleInput = (process.env.ADMIN_ROLE ?? 'SUPER_ADMIN').trim().toUpperCase();
  const name = process.env.ADMIN_NAME?.trim();

  if (!phone || !/^[+]?[0-9]{10,15}$/.test(phone)) {
    throw new Error('ADMIN_PHONE is required and must be a valid phone number (E.164, e.g. +9199...).');
  }
  const allowed: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SUPPORT];
  const role = roleInput as UserRole;
  if (!allowed.includes(role)) {
    throw new Error(`ADMIN_ROLE must be one of ${allowed.join(', ')}`);
  }

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.upsert({
      where: { phone },
      update: { role, name: name ?? undefined, isActive: true, deletedAt: null },
      create: { phone, name, role },
    });
    const admin = await tx.admin.upsert({
      where: { userId: user.id },
      update: { isActive: true, deletedAt: null },
      create: {
        userId: user.id,
        department: role === UserRole.SUPER_ADMIN ? 'Founders' : undefined,
        permissions: role === UserRole.SUPER_ADMIN ? ['*'] : [],
        isActive: true,
      },
    });
    return { user, admin };
  });

  // eslint-disable-next-line no-console
  console.log(`✓ ${role} ready: ${result.user.phone} (userId=${result.user.id})`);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(`✗ ${(e as Error).message}`);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
