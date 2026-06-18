import type {
  NotificationType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  PrescriptionStatus,
  RiderStatus,
  ServiceType,
  UserRole,
} from '@kawkaw/shared-types';

/** Prisma Decimal fields serialize to strings over JSON. */
export type Money = string;

export interface SessionUser {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  role: UserRole;
}

export interface User {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  rider?: Rider | null;
  admin?: Admin | null;
}

export interface Address {
  id: string;
  type: string;
  label: string | null;
  line1: string;
  line2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  receiverName: string | null;
  receiverPhone: string | null;
}

export interface Rider {
  id: string;
  userId: string;
  vehicleType: string | null;
  vehicleNumber: string | null;
  licenseNumber: string | null;
  status: RiderStatus;
  isVerified: boolean;
  currentLatitude: number | null;
  currentLongitude: number | null;
  lastLocationAt: string | null;
  rating: number;
  totalDeliveries: number;
  totalEarnings: Money;
  createdAt: string;
  user?: Pick<User, 'id' | 'name' | 'phone' | 'isActive'> | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  serviceType: ServiceType;
  sortOrder: number;
  isActive: boolean;
  parentId: string | null;
}

export interface Inventory {
  id: string;
  productId: string;
  quantity: number;
  lowStockThreshold: number;
  isInStock: boolean;
  warehouseLocation: string | null;
  product?: Pick<Product, 'id' | 'name' | 'sku' | 'serviceType'> | null;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  images: string[];
  categoryId: string;
  serviceType: ServiceType;
  sku: string;
  price: Money;
  mrp: Money;
  unit: string;
  isActive: boolean;
  isFeatured: boolean;
  requiresPrescription: boolean;
  createdAt: string;
  category?: Pick<Category, 'id' | 'name'> | null;
  inventory?: Pick<Inventory, 'quantity' | 'lowStockThreshold' | 'isInStock'> | null;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  unitPrice: Money;
  quantity: number;
  total: Money;
}

export interface OrderStatusHistoryEntry {
  id: string;
  status: OrderStatus;
  note: string | null;
  changedById: string | null;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  addressId: string;
  riderId: string | null;
  serviceType: ServiceType;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  subtotal: Money;
  deliveryFee: Money;
  discount: Money;
  tax: Money;
  total: Money;
  notes: string | null;
  cancellationReason: string | null;
  deliveryLatitude: number | null;
  deliveryLongitude: number | null;
  placedAt: string;
  assignedAt: string | null;
  acceptedAt: string | null;
  pickedUpAt: string | null;
  outForDeliveryAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  user?: Pick<User, 'name' | 'phone'> | null;
  address?: Address | null;
  rider?: (Pick<Rider, 'id' | 'vehicleType' | 'vehicleNumber'> & { user?: Pick<User, 'name' | 'phone'> | null }) | null;
  items?: OrderItem[];
  statusHistory?: OrderStatusHistoryEntry[];
}

export interface Prescription {
  id: string;
  userId: string;
  orderId: string | null;
  imageUrl: string;
  status: PrescriptionStatus;
  rejectionReason: string | null;
  notes: string | null;
  verifiedById: string | null;
  verifiedAt: string | null;
  createdAt: string;
  user?: Pick<User, 'id' | 'name' | 'phone'> | null;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  before: unknown;
  after: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  actor?: Pick<User, 'name' | 'phone' | 'role'> | null;
}

export interface Admin {
  id: string;
  userId: string;
  department: string | null;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  user?: Pick<User, 'id' | 'name' | 'phone' | 'role' | 'isActive'> | null;
}

export interface DashboardMetrics {
  totalUsers: number;
  totalRiders: number;
  onlineRiders: number;
  totalProducts: number;
  todayOrders: number;
  pendingPrescriptions: number;
  revenueToday: number;
  ordersByStatus: Record<string, number>;
}

export interface Analytics {
  days: number;
  series: Array<{ day: string; orders: number; revenue: number }>;
  topProducts: Array<{ name: string; quantity: number }>;
  serviceBreakdown: Array<{ serviceType: ServiceType; orders: number; revenue: number }>;
  riderPerformance: Array<{ riderId: string; name: string | null; phone: string; deliveries: number; earnings: number }>;
}

export interface Setting {
  key: string;
  value: unknown;
  description: string | null;
  category: string;
  isPublic: boolean;
}
