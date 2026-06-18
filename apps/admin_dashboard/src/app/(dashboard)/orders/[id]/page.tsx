'use client';

import { Icon } from '@/components/layout/icons';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CenterSpinner,
  ErrorState,
  Input,
  Label,
  Textarea,
} from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/cn';
import { dateTime, inr, orderStatusColor, riderStatusColor, titleCase } from '@/lib/format';
import { useAssignRider, useCancelOrder, useOrder, useRiders } from '@/lib/queries';
import type { Order, Rider } from '@/lib/types';
import { OrderStatus, TERMINAL_ORDER_STATUSES, UserRole } from '@kawkaw/shared-types';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';

const LIFECYCLE: { status: OrderStatus; field: keyof Order; label: string }[] = [
  { status: OrderStatus.PENDING, field: 'placedAt', label: 'Placed' },
  { status: OrderStatus.ASSIGNED, field: 'assignedAt', label: 'Assigned to rider' },
  { status: OrderStatus.ACCEPTED, field: 'acceptedAt', label: 'Accepted by rider' },
  { status: OrderStatus.PICKED_UP, field: 'pickedUpAt', label: 'Picked up' },
  { status: OrderStatus.OUT_FOR_DELIVERY, field: 'outForDeliveryAt', label: 'Out for delivery' },
  { status: OrderStatus.DELIVERED, field: 'deliveredAt', label: 'Delivered' },
];

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { hasRole } = useAuth();
  const toast = useToast();
  const { data: order, isLoading, isError, error, refetch } = useOrder(id);
  const assign = useAssignRider();
  const cancel = useCancelOrder();

  const [assignOpen, setAssignOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  if (isLoading) return <CenterSpinner label="Loading order…" />;
  if (isError || !order) return <ErrorState message={(error as Error)?.message ?? 'Order not found'} onRetry={refetch} />;

  const canManage = hasRole(UserRole.ADMIN, UserRole.SUPER_ADMIN);
  const isTerminal = TERMINAL_ORDER_STATUSES.includes(order.status);
  const canAssign = canManage && order.status === OrderStatus.PENDING;
  const canCancel = canManage && !isTerminal;

  const doCancel = () => {
    cancel.mutate(
      { orderId: order.id, reason: cancelReason.trim() || 'Cancelled by admin' },
      {
        onSuccess: () => {
          toast.success('Order cancelled');
          setCancelOpen(false);
        },
        onError: (e) => toast.error((e as Error).message),
      },
    );
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/orders" className="text-xs text-ink-muted hover:text-ink">
            ← Back to orders
          </Link>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-xl font-semibold text-ink">{order.orderNumber}</h1>
            <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium', orderStatusColor(order.status))}>
              {titleCase(order.status)}
            </span>
          </div>
          <p className="mt-1 text-sm text-ink-muted">
            {titleCase(order.serviceType)} · placed {dateTime(order.placedAt)}
          </p>
        </div>
        <div className="flex gap-2">
          {canAssign && <Button onClick={() => setAssignOpen(true)}>Assign rider</Button>}
          {canCancel && (
            <Button variant="danger" onClick={() => setCancelOpen(true)}>
              Cancel order
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Items + totals */}
        <Card className="lg:col-span-2">
          <CardHeader title="Items" subtitle={`${order.items?.length ?? 0} item(s)`} />
          <div className="divide-y divide-surface-border">
            {(order.items ?? []).map((it) => (
              <div key={it.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <div>
                  <p className="font-medium text-ink">{it.productName}</p>
                  <p className="text-xs text-ink-muted">
                    {inr(it.unitPrice)} × {it.quantity}
                  </p>
                </div>
                <span className="font-medium text-ink">{inr(it.total)}</span>
              </div>
            ))}
            {(order.items ?? []).length === 0 && <p className="px-5 py-6 text-sm text-ink-muted">No line items.</p>}
          </div>
          <div className="space-y-1.5 border-t border-surface-border px-5 py-4 text-sm">
            <Row label="Subtotal" value={inr(order.subtotal)} />
            <Row label="Delivery fee" value={inr(order.deliveryFee)} />
            {Number(order.discount) > 0 && <Row label="Discount" value={`- ${inr(order.discount)}`} />}
            {Number(order.tax) > 0 && <Row label="Tax" value={inr(order.tax)} />}
            <div className="flex items-center justify-between border-t border-surface-border pt-2 text-base font-semibold text-ink">
              <span>Total (COD)</span>
              <span>{inr(order.total)}</span>
            </div>
            <p className="pt-1 text-xs text-ink-muted">
              Payment: {titleCase(order.paymentMethod)} · {titleCase(order.paymentStatus)}
            </p>
          </div>
        </Card>

        {/* Side panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Customer" />
            <div className="space-y-1 px-5 py-4 text-sm">
              <p className="font-medium text-ink">{order.user?.name ?? '—'}</p>
              <p className="text-ink-muted">{order.user?.phone}</p>
            </div>
          </Card>

          <Card>
            <CardHeader title="Delivery address" />
            <div className="px-5 py-4 text-sm text-ink-soft">
              {order.address ? (
                <>
                  <p>{[order.address.line1, order.address.line2].filter(Boolean).join(', ')}</p>
                  {order.address.landmark && <p className="text-ink-muted">Near {order.address.landmark}</p>}
                  <p className="text-ink-muted">
                    {order.address.city}, {order.address.state} {order.address.pincode}
                  </p>
                  {order.address.receiverName && (
                    <p className="mt-2 text-xs text-ink-muted">
                      Receiver: {order.address.receiverName} · {order.address.receiverPhone}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-ink-muted">No address on file.</p>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Rider" />
            <div className="px-5 py-4 text-sm">
              {order.rider?.user ? (
                <>
                  <p className="font-medium text-ink">{order.rider.user.name ?? '—'}</p>
                  <p className="text-ink-muted">{order.rider.user.phone}</p>
                  <p className="mt-1 text-xs text-ink-muted">
                    {order.rider.vehicleType} · {order.rider.vehicleNumber}
                  </p>
                </>
              ) : (
                <p className="text-ink-muted">Not yet assigned.</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Lifecycle */}
      <Card className="mt-6">
        <CardHeader title="Lifecycle" subtitle="Order status timeline" />
        <div className="px-5 py-5">
          {order.status === OrderStatus.CANCELLED ? (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              Cancelled {order.cancelledAt ? `· ${dateTime(order.cancelledAt)}` : ''}
              {order.cancellationReason ? ` — ${order.cancellationReason}` : ''}
            </div>
          ) : (
            <ol className="space-y-4">
              {LIFECYCLE.map((step) => {
                const ts = order[step.field] as string | null;
                const done = Boolean(ts);
                return (
                  <li key={step.status} className="flex items-start gap-3">
                    <span
                      className={cn(
                        'mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-white',
                        done ? 'bg-status-success' : 'bg-surface-border',
                      )}
                    >
                      {done ? <Icon name="check" className="h-4 w-4" /> : <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </span>
                    <div>
                      <p className={cn('text-sm font-medium', done ? 'text-ink' : 'text-ink-muted')}>{step.label}</p>
                      <p className="text-xs text-ink-muted">{ts ? dateTime(ts) : 'Pending'}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </Card>

      <AssignRiderModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        loading={assign.isPending}
        onAssign={(riderId) =>
          assign.mutate(
            { orderId: order.id, riderId },
            {
              onSuccess: () => {
                toast.success('Rider assigned');
                setAssignOpen(false);
              },
              onError: (e) => toast.error((e as Error).message),
            },
          )
        }
      />

      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancel order"
        footer={
          <>
            <Button variant="outline" onClick={() => setCancelOpen(false)} disabled={cancel.isPending}>
              Keep order
            </Button>
            <Button variant="danger" onClick={doCancel} loading={cancel.isPending}>
              Cancel order
            </Button>
          </>
        }
      >
        <Label htmlFor="reason">Reason</Label>
        <Textarea id="reason" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Why is this order being cancelled?" />
      </Modal>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-ink-soft">
      <span className="text-ink-muted">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function AssignRiderModal({
  open,
  onClose,
  onAssign,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onAssign: (riderId: string) => void;
  loading: boolean;
}) {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useRiders({ pageSize: 100, search: search || undefined });
  const verified = (data?.items ?? []).filter((r: Rider) => r.isVerified);

  return (
    <Modal open={open} onClose={onClose} title="Assign a rider" size="lg">
      <Input placeholder="Search riders…" value={search} onChange={(e) => setSearch(e.target.value)} className="mb-3" />
      {isLoading ? (
        <CenterSpinner />
      ) : verified.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink-muted">No verified riders available.</p>
      ) : (
        <div className="max-h-80 space-y-2 overflow-y-auto">
          {verified.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-lg border border-surface-border px-3 py-2">
              <div>
                <p className="text-sm font-medium text-ink">{r.user?.name ?? '—'}</p>
                <p className="text-xs text-ink-muted">
                  {r.user?.phone} · {r.vehicleType ?? 'vehicle n/a'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={riderStatusColor(r.status)}>{titleCase(r.status)}</Badge>
                <Button size="sm" disabled={loading} onClick={() => onAssign(r.id)}>
                  Assign
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
