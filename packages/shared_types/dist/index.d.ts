/**
 * Shared contracts for Kaw Kaw.
 * These enums and DTO shapes are the single source of truth shared between the
 * NestJS API and the Next.js admin dashboard. They MUST stay in sync with the
 * Prisma schema (services/api/prisma/schema.prisma).
 */
export declare enum UserRole {
    CUSTOMER = "CUSTOMER",
    RIDER = "RIDER",
    ADMIN = "ADMIN",
    SUPER_ADMIN = "SUPER_ADMIN",
    SUPPORT = "SUPPORT"
}
export declare enum ServiceType {
    GROCERY = "GROCERY",
    PHARMACY = "PHARMACY",
    FOOD = "FOOD",
    PARCEL = "PARCEL"
}
/** Canonical order lifecycle. Forward-only except CANCELLED. */
export declare enum OrderStatus {
    PENDING = "PENDING",
    ASSIGNED = "ASSIGNED",
    ACCEPTED = "ACCEPTED",
    PICKED_UP = "PICKED_UP",
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY",
    DELIVERED = "DELIVERED",
    CANCELLED = "CANCELLED"
}
export declare enum PaymentMethod {
    COD = "COD"
}
export declare enum PaymentStatus {
    PENDING = "PENDING",
    COLLECTED = "COLLECTED",
    FAILED = "FAILED",
    REFUNDED = "REFUNDED"
}
export declare enum RiderStatus {
    OFFLINE = "OFFLINE",
    ONLINE = "ONLINE",
    BUSY = "BUSY"
}
export declare enum PrescriptionStatus {
    PENDING = "PENDING",
    VERIFIED = "VERIFIED",
    REJECTED = "REJECTED"
}
export declare enum NotificationType {
    ORDER_UPDATE = "ORDER_UPDATE",
    PROMOTION = "PROMOTION",
    SYSTEM = "SYSTEM",
    RIDER_ASSIGNMENT = "RIDER_ASSIGNMENT"
}
export declare enum CouponType {
    PERCENTAGE = "PERCENTAGE",
    FIXED = "FIXED"
}
/**
 * Allowed forward transitions for the order lifecycle. CANCELLED is reachable
 * from any non-terminal state (enforced separately).
 *
 * Typed as string-keyed/string-valued so the map interoperates with both this
 * package's OrderStatus and the API's Prisma-generated OrderStatus (which are
 * nominally distinct enums with identical members).
 */
export declare const ORDER_STATUS_TRANSITIONS: Record<string, string[]>;
export declare const TERMINAL_ORDER_STATUSES: string[];
export declare const WS_EVENTS: {
    readonly ORDER_STATUS_CHANGED: "order:status_changed";
    readonly ORDER_ASSIGNED: "order:assigned";
    readonly RIDER_LOCATION: "rider:location";
    readonly NOTIFICATION: "notification";
};
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
