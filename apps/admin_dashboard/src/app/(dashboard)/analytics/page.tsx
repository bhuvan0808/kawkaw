'use client';

import { BarChart, RankBars } from '@/components/BarChart';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Card, CardHeader, CenterSpinner, EmptyState, ErrorState, PageHeader, Select } from '@/components/ui/primitives';
import { dateOnly, inr, num, titleCase } from '@/lib/format';
import { useAnalytics } from '@/lib/queries';
import type { Analytics } from '@/lib/types';
import { useState } from 'react';

const DAY_OPTIONS = [7, 14, 30, 90];

type RiderRow = Analytics['riderPerformance'][number];

/** Short date label for chart axes (drop the trailing year). */
function shortDay(day: string): string {
  return dateOnly(day).replace(/\s\d{4}$/, '');
}

export default function AnalyticsPage() {
  const [days, setDays] = useState(7);
  const { data, isLoading, isError, error, refetch } = useAnalytics(days);

  const riderColumns: Column<RiderRow>[] = [
    { key: 'name', header: 'Rider', render: (r) => <span className="font-medium text-ink">{r.name ?? '—'}</span> },
    { key: 'phone', header: 'Phone', render: (r) => <span className="text-ink-soft">{r.phone}</span> },
    { key: 'deliveries', header: 'Deliveries', align: 'right', render: (r) => <span className="text-ink-soft">{num(r.deliveries)}</span> },
    { key: 'earnings', header: 'Earnings', align: 'right', render: (r) => <span className="font-medium text-ink">{inr(r.earnings)}</span> },
  ];

  const daysSelect = (
    <Select value={days} onChange={(e) => setDays(Number(e.target.value))} className="w-40">
      {DAY_OPTIONS.map((d) => (
        <option key={d} value={d}>Last {d} days</option>
      ))}
    </Select>
  );

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Operational trends across the Kaw Kaw platform." action={daysSelect} />

      {isLoading ? (
        <CenterSpinner label="Loading analytics…" />
      ) : isError ? (
        <ErrorState message={(error as Error).message} onRetry={() => refetch()} />
      ) : (
        (() => {
          const a = data!;
          const series = a.series ?? [];
          const breakdown = a.serviceBreakdown ?? [];
          const riders = a.riderPerformance ?? [];
          const products = a.topProducts ?? [];

          return (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader title={`Orders — last ${a.days} days`} subtitle="Daily order volume" />
                  <div className="p-5">
                    {series.length === 0 ? (
                      <p className="py-10 text-center text-sm text-ink-muted">No orders in this window yet.</p>
                    ) : (
                      <BarChart data={series.map((s) => ({ label: shortDay(String(s.day)), value: s.orders }))} format={num} />
                    )}
                  </div>
                </Card>

                <Card>
                  <CardHeader title={`Revenue — last ${a.days} days`} subtitle="Daily revenue" />
                  <div className="p-5">
                    {series.length === 0 ? (
                      <p className="py-10 text-center text-sm text-ink-muted">No revenue in this window yet.</p>
                    ) : (
                      <BarChart data={series.map((s) => ({ label: shortDay(String(s.day)), value: s.revenue }))} format={inr} />
                    )}
                  </div>
                </Card>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader title="By service line" subtitle="Orders and revenue per service." />
                  <div className="p-5">
                    {breakdown.length === 0 ? (
                      <EmptyState title="No service data" message="No orders across services yet." />
                    ) : (
                      <div className="space-y-5">
                        <RankBars data={breakdown.map((b) => ({ label: titleCase(b.serviceType), value: b.orders }))} format={num} />
                        <div className="divide-y divide-surface-border border-t border-surface-border pt-2">
                          {breakdown.map((b) => (
                            <div key={b.serviceType} className="flex items-center justify-between py-2 text-sm">
                              <span className="text-ink-soft">{titleCase(b.serviceType)}</span>
                              <span className="font-medium text-ink">{inr(b.revenue)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                <Card>
                  <CardHeader title="Top products" subtitle="Best sellers by quantity." />
                  <div className="p-5">
                    {products.length === 0 ? (
                      <EmptyState title="No product data" message="No products sold in this window yet." />
                    ) : (
                      <RankBars data={products.map((p) => ({ label: p.name, value: p.quantity }))} format={num} />
                    )}
                  </div>
                </Card>
              </div>

              <Card>
                <CardHeader title="Top riders" subtitle="Deliveries and earnings by rider." />
                <DataTable
                  columns={riderColumns}
                  rows={riders}
                  keyField={(r) => r.riderId}
                  emptyTitle="No rider activity"
                  emptyMessage="No deliveries completed in this window yet."
                />
              </Card>
            </div>
          );
        })()
      )}
    </div>
  );
}
