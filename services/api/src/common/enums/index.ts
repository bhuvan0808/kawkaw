/**
 * Runtime enums are owned by Prisma (generated into @prisma/client).
 * Re-export them here so the rest of the app has one import site, and re-export
 * the shared lifecycle helpers from @kawkaw/shared-types.
 */
export {
  UserRole,
  ServiceType,
  AddressType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  RiderStatus,
  PrescriptionStatus,
  NotificationType,
  CouponType,
} from '@prisma/client';

export { ORDER_STATUS_TRANSITIONS, TERMINAL_ORDER_STATUSES, WS_EVENTS } from '@kawkaw/shared-types';

import { UserRole as PrismaUserRole } from '@prisma/client';

/** Staff roles (read access to operational data). */
export const STAFF_ROLES: PrismaUserRole[] = [
  PrismaUserRole.ADMIN,
  PrismaUserRole.SUPER_ADMIN,
  PrismaUserRole.SUPPORT,
];

/** Roles allowed to perform privileged admin mutations. */
export const ADMIN_ROLES: PrismaUserRole[] = [PrismaUserRole.ADMIN, PrismaUserRole.SUPER_ADMIN];
