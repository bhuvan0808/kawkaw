import { OrderStatus, PrescriptionStatus, RiderStatus } from '@kawkaw/shared-types';

export function inr(value: string | number | null | undefined): string {
  const n = typeof value === 'string' ? Number(value) : (value ?? 0);
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
    Number.isFinite(n) ? n : 0,
  );
}

export function num(value: number | null | undefined): string {
  return new Intl.NumberFormat('en-IN').format(value ?? 0);
}

export function dateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

export function dateOnly(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { dateStyle: 'medium' });
}

export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return '—';
  const diff = Date.now() - d;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

export function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/[_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Tailwind class tuples for a status pill — [bg, text]. */
export function orderStatusColor(status: string): string {
  const map: Record<string, string> = {
    [OrderStatus.PENDING]: 'bg-slate-100 text-slate-700',
    [OrderStatus.ASSIGNED]: 'bg-blue-100 text-blue-700',
    [OrderStatus.ACCEPTED]: 'bg-indigo-100 text-indigo-700',
    [OrderStatus.PICKED_UP]: 'bg-violet-100 text-violet-700',
    [OrderStatus.OUT_FOR_DELIVERY]: 'bg-amber-100 text-amber-700',
    [OrderStatus.DELIVERED]: 'bg-green-100 text-green-700',
    [OrderStatus.CANCELLED]: 'bg-red-100 text-red-700',
  };
  return map[status] ?? 'bg-slate-100 text-slate-700';
}

export function riderStatusColor(status: string): string {
  const map: Record<string, string> = {
    [RiderStatus.ONLINE]: 'bg-green-100 text-green-700',
    [RiderStatus.BUSY]: 'bg-amber-100 text-amber-700',
    [RiderStatus.OFFLINE]: 'bg-slate-100 text-slate-600',
  };
  return map[status] ?? 'bg-slate-100 text-slate-600';
}

export function prescriptionStatusColor(status: string): string {
  const map: Record<string, string> = {
    [PrescriptionStatus.PENDING]: 'bg-amber-100 text-amber-700',
    [PrescriptionStatus.VERIFIED]: 'bg-green-100 text-green-700',
    [PrescriptionStatus.REJECTED]: 'bg-red-100 text-red-700',
  };
  return map[status] ?? 'bg-slate-100 text-slate-700';
}

export function initials(name: string | null | undefined, phone?: string): string {
  if (name) {
    return name
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }
  return phone ? phone.slice(-2) : '??';
}
