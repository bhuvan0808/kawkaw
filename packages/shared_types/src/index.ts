/**
 * Shared contracts for Kaw Kaw.
 * These enums and DTO shapes are the single source of truth shared between the
 * NestJS API and the Next.js admin dashboard. They MUST stay in sync with the
 * Prisma schema (services/api/prisma/schema.prisma).
 */

// ---------------------------------------------------------------------------
// Enums (mirror Prisma)
// ---------------------------------------------------------------------------

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  RIDER = 'RIDER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
  SUPPORT = 'SUPPORT',
}

export enum ServiceType {
  GROCERY = 'GROCERY',
  PHARMACY = 'PHARMACY',
  FOOD = 'FOOD',
  PARCEL = 'PARCEL',
}

/** Canonical order lifecycle. Forward-only except CANCELLED. */
export enum OrderStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  ACCEPTED = 'ACCEPTED',
  PICKED_UP = 'PICKED_UP',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  COD = 'COD',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COLLECTED = 'COLLECTED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum RiderStatus {
  OFFLINE = 'OFFLINE',
  ONLINE = 'ONLINE',
  BUSY = 'BUSY',
}

export enum PrescriptionStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export enum NotificationType {
  ORDER_UPDATE = 'ORDER_UPDATE',
  PROMOTION = 'PROMOTION',
  SYSTEM = 'SYSTEM',
  RIDER_ASSIGNMENT = 'RIDER_ASSIGNMENT',
}

export enum CouponType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
}

/**
 * Allowed forward transitions for the order lifecycle. CANCELLED is reachable
 * from any non-terminal state (enforced separately).
 *
 * Typed as string-keyed/string-valued so the map interoperates with both this
 * package's OrderStatus and the API's Prisma-generated OrderStatus (which are
 * nominally distinct enums with identical members).
 */
export const ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
  [OrderStatus.PENDING]: [OrderStatus.ASSIGNED, OrderStatus.CANCELLED],
  [OrderStatus.ASSIGNED]: [OrderStatus.ACCEPTED, OrderStatus.CANCELLED],
  [OrderStatus.ACCEPTED]: [OrderStatus.PICKED_UP, OrderStatus.CANCELLED],
  [OrderStatus.PICKED_UP]: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED],
  [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};

export const TERMINAL_ORDER_STATUSES: string[] = [OrderStatus.DELIVERED, OrderStatus.CANCELLED];

// ---------------------------------------------------------------------------
// Realtime (WebSocket) event names
// ---------------------------------------------------------------------------

export const WS_EVENTS = {
  ORDER_STATUS_CHANGED: 'order:status_changed',
  ORDER_ASSIGNED: 'order:assigned',
  RIDER_LOCATION: 'rider:location',
  NOTIFICATION: 'notification',
} as const;

// ---------------------------------------------------------------------------
// Standard API response envelope + error shape
// ---------------------------------------------------------------------------

export interface ApiError {
  statusCode: number;
  errorCode: string;
  message: string;
  details?: unknown;
  timestamp: string;
  path: string;
  requestId?: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
