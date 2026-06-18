'use client';

import { BarChart } from '@/components/BarChart';
import { Icon, type IconName } from '@/components/layout/icons';
import { Card, CardHeader, CenterSpinner, ErrorState, PageHeader } from '@/components/ui/primitives';
import { cn } from '@/lib/cn';
import { dateOnly, inr, num, orderStatusColor, titleCase } from '@/lib/format';
import { useAnalytics, useDashboard, useLowStock } from '@/lib/queries';
import Link from 'next/link';

function StatCard({
  label,
  value,
  icon,
  href,
  tone = 'default',
}: {
  label: string;
  value: string;
  icon: IconName;
  href?: string;
  tone?: 'default' | 'warning' | 'success';
}) {
  const body = (
    <Card className={cn('flex items-center gap-4 p-5 transition hover:shadow-md', href && 'cursor-pointer')}>
      <div
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
          tone === 'warning' && 'bg-amber-100 text-amber-700',
          tone === 'success' && 'bg-green-100 text-green-700',
          tone === 'default' && 'bg-brand-100 text-brand-700',
        )}
      >
        <Icon name={icon} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</p>
        <p className="mt-0.5 text-2xl font-semibold text-ink">{value}</p>
      </div>
    </Card>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export default function DashboardPage() {
  const dash = useDashboard();
  const analytics = useAnalytics(7);
  const lowStock = useLowStock();

  if (dash.isLoading) return <CenterSpinner label="Loading dashboard…" />;
  if (dash.isError) return <ErrorState message={(dash.error as Error).message} onRetry={() => dash.refetch()} />;

  const m = dash.data!;
  const lowStockCount = lowStock.data?.length ?? 0;
  const series = analytics.data?.series ?? [];

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Today at a glance for Bhadrachalam operations." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Orders today" value={num(m.todayOrders)} icon="orders" href="/orders" />
        <StatCard label="Revenue today" value={inr(m.revenueToday)} icon="analytics" tone="success" />
        <StatCard label="Active riders" value={`${num(m.onlineRiders)} / ${num(m.totalRiders)}`} icon="users" href="/users" />
        <StatCard label="Customers" value={num(m.totalUsers)} icon="users" href="/users" />
        <StatCard
          label="Pending prescriptions"
          value={num(m.pendingPrescriptions)}
          icon="pharmacy"
          href="/pharmacy"
          tone={m.pendingPrescriptions > 0 ? 'warning' : 'default'}
        />
        <StatCard
          label="Inventory alerts"
          value={num(lowStockCount)}
          icon="inventory"
          href="/inventory"
          tone={lowStockCount > 0 ? 'warning' : 'default'}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Orders — last 7 days" subtitle="Daily order volume" />
          <div className="p-5">
            {analytics.isLoading ? (
              <CenterSpinner />
            ) : series.length === 0 ? (
              <p className="py-10 text-center text-sm text-ink-muted">No orders in this window yet.</p>
            ) : (
              <BarChart
                data={series.map((s) => ({ label: dateOnly(String(s.day)).replace(/\s\d{4}$/, ''), value: s.orders }))}
              />
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Orders by status" subtitle="All-time pipeline" />
          <div className="divide-y divide-surface-border">
            {Object.entries(m.ordersByStatus).length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-ink-muted">No orders yet.</p>
            )}
            {Object.entries(m.ordersByStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between px-5 py-3">
                <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium', orderStatusColor(status))}>
                  {titleCase(status)}
                </span>
                <span className="text-sm font-semibold text-ink">{num(count)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
