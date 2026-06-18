'use client';

import type { NotificationType, Paginated, UserRole } from '@kawkaw/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api-client';
import type {
  Admin,
  Analytics,
  AuditLog,
  Category,
  DashboardMetrics,
  Inventory,
  Order,
  Prescription,
  Product,
  Rider,
  Setting,
  User,
} from './types';

// ----------------------------------------------------------- query params
export interface ListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  [key: string]: string | number | boolean | undefined;
}

const list = <T>(path: string, params: ListParams) => () => api.list<T>(path, params);

// ----------------------------------------------------------- dashboard
export function useDashboard() {
  return useQuery({ queryKey: ['dashboard'], queryFn: () => api.get<DashboardMetrics>('/admin/dashboard') });
}

export function useAnalytics(days: number) {
  return useQuery({ queryKey: ['analytics', days], queryFn: () => api.get<Analytics>('/admin/analytics', { days }) });
}

// ----------------------------------------------------------- orders
export function useOrders(params: ListParams) {
  return useQuery({ queryKey: ['orders', params], queryFn: list<Order>('/orders/admin/all', params) });
}

export function useOrder(id: string | undefined) {
  return useQuery({ queryKey: ['order', id], queryFn: () => api.get<Order>(`/orders/${id}`), enabled: Boolean(id) });
}

export function useAssignRider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, riderId }: { orderId: string; riderId: string }) =>
      api.post<Order>(`/orders/${orderId}/assign`, { riderId }),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['order', v.orderId] });
    },
  });
}

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason: string }) =>
      api.post<Order>(`/orders/${orderId}/cancel`, { reason }),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['order', v.orderId] });
    },
  });
}

// ----------------------------------------------------------- riders
export function useRiders(params: ListParams) {
  return useQuery({ queryKey: ['riders', params], queryFn: list<Rider>('/riders', params) });
}

export function useVerifyRider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ riderId, isVerified }: { riderId: string; isVerified: boolean }) =>
      api.patch<Rider>(`/riders/${riderId}/verify`, { isVerified }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['riders'] }),
  });
}

// ----------------------------------------------------------- products
export function useProducts(params: ListParams) {
  return useQuery({ queryKey: ['products', params], queryFn: list<Product>('/products', params) });
}

export interface ProductInput {
  name: string;
  description?: string;
  imageUrl?: string;
  images?: string[];
  categoryId: string;
  serviceType: string;
  sku: string;
  price: number;
  mrp: number;
  unit?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  requiresPrescription?: boolean;
  initialStock?: number;
}

export function useSaveProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: Partial<ProductInput> }) =>
      id ? api.patch<Product>(`/products/${id}`, input) : api.post<Product>('/products', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/products/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}

// ----------------------------------------------------------- categories
export function useCategories(serviceType?: string) {
  return useQuery({
    queryKey: ['categories', serviceType ?? 'all'],
    queryFn: () => api.get<Category[]>('/categories', serviceType ? { serviceType } : undefined),
  });
}

export interface CategoryInput {
  name: string;
  description?: string;
  imageUrl?: string;
  serviceType: string;
  sortOrder?: number;
  isActive?: boolean;
  parentId?: string;
}

export function useSaveCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: Partial<CategoryInput> }) =>
      id ? api.patch<Category>(`/categories/${id}`, input) : api.post<Category>('/categories', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/categories/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
}

// ----------------------------------------------------------- inventory
export function useLowStock() {
  return useQuery({ queryKey: ['inventory', 'low-stock'], queryFn: () => api.get<Inventory[]>('/inventory/low-stock') });
}

export function useSetStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      quantity,
      lowStockThreshold,
    }: {
      productId: string;
      quantity: number;
      lowStockThreshold?: number;
    }) => api.patch<Inventory>(`/inventory/${productId}`, { quantity, lowStockThreshold }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] });
      qc.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useAdjustStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, delta }: { productId: string; delta: number }) =>
      api.post<Inventory>(`/inventory/${productId}/adjust`, { delta }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] });
      qc.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

// ----------------------------------------------------------- users
export function useUsers(params: ListParams) {
  return useQuery({ queryKey: ['users', params], queryFn: list<User>('/users', params) });
}

export function useUser(id: string | undefined) {
  return useQuery({ queryKey: ['user', id], queryFn: () => api.get<User>(`/users/${id}`), enabled: Boolean(id) });
}

export function useSetUserActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch<User>(`/users/${id}/active`, { isActive }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['riders'] });
    },
  });
}

export function useSetUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) => api.patch<User>(`/users/${id}/role`, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

// ----------------------------------------------------------- prescriptions
export function usePendingPrescriptions() {
  return useQuery({ queryKey: ['prescriptions', 'pending'], queryFn: () => api.get<Prescription[]>('/prescriptions/pending') });
}

export function useVerifyPrescription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      rejectionReason,
      notes,
    }: {
      id: string;
      status: 'VERIFIED' | 'REJECTED';
      rejectionReason?: string;
      notes?: string;
    }) => api.patch<Prescription>(`/prescriptions/${id}/verify`, { status, rejectionReason, notes }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prescriptions'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// ----------------------------------------------------------- notifications
export function useBroadcast() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { type: NotificationType; title: string; body: string; role?: string }) =>
      api.post<{ count?: number }>('/notifications/broadcast', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['audit', { entityType: 'Notification' }] }),
  });
}

/** Notification history is derived from the audit trail (broadcasts are audited). */
export function useNotificationHistory(params: ListParams) {
  const merged = { ...params, entityType: 'Notification' };
  return useQuery({ queryKey: ['audit', merged], queryFn: list<AuditLog>('/audit-logs', merged) });
}

// ----------------------------------------------------------- audit
export function useAuditLogs(params: ListParams) {
  return useQuery({ queryKey: ['audit', params], queryFn: list<AuditLog>('/audit-logs', params) });
}

// ----------------------------------------------------------- admins
export function useAdmins() {
  return useQuery({ queryKey: ['admins'], queryFn: () => api.get<Admin[]>('/admin/admins') });
}

export function useCreateAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { phone: string; name?: string; role: UserRole; department?: string }) =>
      api.post<Admin>('/admin/admins', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admins'] }),
  });
}

// ----------------------------------------------------------- settings
export function useSettings() {
  return useQuery({ queryKey: ['settings'], queryFn: () => api.get<Setting[]>('/settings') });
}

export function useUpsertSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { key: string; value: unknown; description?: string; category?: string; isPublic?: boolean }) =>
      api.post<Setting>('/settings', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  });
}

export type { Paginated };
