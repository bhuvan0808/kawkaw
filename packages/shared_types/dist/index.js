"use strict";
/**
 * Shared contracts for Kaw Kaw.
 * These enums and DTO shapes are the single source of truth shared between the
 * NestJS API and the Next.js admin dashboard. They MUST stay in sync with the
 * Prisma schema (services/api/prisma/schema.prisma).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WS_EVENTS = exports.TERMINAL_ORDER_STATUSES = exports.ORDER_STATUS_TRANSITIONS = exports.CouponType = exports.NotificationType = exports.PrescriptionStatus = exports.RiderStatus = exports.PaymentStatus = exports.PaymentMethod = exports.OrderStatus = exports.ServiceType = exports.UserRole = void 0;
// ---------------------------------------------------------------------------
// Enums (mirror Prisma)
// ---------------------------------------------------------------------------
var UserRole;
(function (UserRole) {
    UserRole["CUSTOMER"] = "CUSTOMER";
    UserRole["RIDER"] = "RIDER";
    UserRole["ADMIN"] = "ADMIN";
    UserRole["SUPER_ADMIN"] = "SUPER_ADMIN";
    UserRole["SUPPORT"] = "SUPPORT";
})(UserRole || (exports.UserRole = UserRole = {}));
var ServiceType;
(function (ServiceType) {
    ServiceType["GROCERY"] = "GROCERY";
    ServiceType["PHARMACY"] = "PHARMACY";
    ServiceType["FOOD"] = "FOOD";
    ServiceType["PARCEL"] = "PARCEL";
})(ServiceType || (exports.ServiceType = ServiceType = {}));
/** Canonical order lifecycle. Forward-only except CANCELLED. */
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "PENDING";
    OrderStatus["ASSIGNED"] = "ASSIGNED";
    OrderStatus["ACCEPTED"] = "ACCEPTED";
    OrderStatus["PICKED_UP"] = "PICKED_UP";
    OrderStatus["OUT_FOR_DELIVERY"] = "OUT_FOR_DELIVERY";
    OrderStatus["DELIVERED"] = "DELIVERED";
    OrderStatus["CANCELLED"] = "CANCELLED";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["COD"] = "COD";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "PENDING";
    PaymentStatus["COLLECTED"] = "COLLECTED";
    PaymentStatus["FAILED"] = "FAILED";
    PaymentStatus["REFUNDED"] = "REFUNDED";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var RiderStatus;
(function (RiderStatus) {
    RiderStatus["OFFLINE"] = "OFFLINE";
    RiderStatus["ONLINE"] = "ONLINE";
    RiderStatus["BUSY"] = "BUSY";
})(RiderStatus || (exports.RiderStatus = RiderStatus = {}));
var PrescriptionStatus;
(function (PrescriptionStatus) {
    PrescriptionStatus["PENDING"] = "PENDING";
    PrescriptionStatus["VERIFIED"] = "VERIFIED";
    PrescriptionStatus["REJECTED"] = "REJECTED";
})(PrescriptionStatus || (exports.PrescriptionStatus = PrescriptionStatus = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["ORDER_UPDATE"] = "ORDER_UPDATE";
    NotificationType["PROMOTION"] = "PROMOTION";
    NotificationType["SYSTEM"] = "SYSTEM";
    NotificationType["RIDER_ASSIGNMENT"] = "RIDER_ASSIGNMENT";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var CouponType;
(function (CouponType) {
    CouponType["PERCENTAGE"] = "PERCENTAGE";
    CouponType["FIXED"] = "FIXED";
})(CouponType || (exports.CouponType = CouponType = {}));
/**
 * Allowed forward transitions for the order lifecycle. CANCELLED is reachable
 * from any non-terminal state (enforced separately).
 *
 * Typed as string-keyed/string-valued so the map interoperates with both this
 * package's OrderStatus and the API's Prisma-generated OrderStatus (which are
 * nominally distinct enums with identical members).
 */
exports.ORDER_STATUS_TRANSITIONS = {
    [OrderStatus.PENDING]: [OrderStatus.ASSIGNED, OrderStatus.CANCELLED],
    [OrderStatus.ASSIGNED]: [OrderStatus.ACCEPTED, OrderStatus.CANCELLED],
    [OrderStatus.ACCEPTED]: [OrderStatus.PICKED_UP, OrderStatus.CANCELLED],
    [OrderStatus.PICKED_UP]: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED],
    [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
    [OrderStatus.DELIVERED]: [],
    [OrderStatus.CANCELLED]: [],
};
exports.TERMINAL_ORDER_STATUSES = [OrderStatus.DELIVERED, OrderStatus.CANCELLED];
// ---------------------------------------------------------------------------
// Realtime (WebSocket) event names
// ---------------------------------------------------------------------------
exports.WS_EVENTS = {
    ORDER_STATUS_CHANGED: 'order:status_changed',
    ORDER_ASSIGNED: 'order:assigned',
    RIDER_LOCATION: 'rider:location',
    NOTIFICATION: 'notification',
};
