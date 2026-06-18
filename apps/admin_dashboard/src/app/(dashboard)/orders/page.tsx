'use client';

import { Card } from '@/components/ui/primitives';
import { DataTable, Pagination, SearchInput, Toolbar, type Column } from '@/components/ui/DataTable';
import { PageHeader, Select } from '@/components/ui/primitives';
import { cn } from '@/lib/cn';
import { dateTime, inr, orderStatusColor, titleCase } from '@/lib/format';
import { useOrders } from '@/lib/queries';
import type { Order } from '@/lib/types';
import { OrderStatus, ServiceType } from '@kawkaw/shared-types';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const PAGE_SIZE = 20;

export default function OrdersPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [serviceType, setServiceType] = useState('');

  const { data, isLoading, isFetching, isError, error, refetch } = useOrders({
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
    status: status || undefined,
    serviceType: serviceType || undefined,
  });

  const columns: Column<Order>[] = [
    {
      key: 'orderNumber',
      header: 'Order',
      render: (o) => (
        <div>
          <p className="font-medium text-ink">{o.orderNumber}</p>
          <p className="text-xs text-ink-muted">{dateTime(o.placedAt)}</p>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (o) => (
        <div>
          <p className="text-ink">{o.user?.name ?? '—'}</p>
          <p className="text-xs text-ink-muted">{o.user?.phone}</p>
        </div>
      ),
    },
    { key: 'serviceType', header: 'Service', render: (o) => <span className="text-ink-soft">{titleCase(o.serviceType)}</span> },
    {
      key: 'status',
      header: 'Status',
      render: (o) => (
        <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium', orderStatusColor(o.status))}>
          {titleCase(o.status)}
        </span>
      ),
    },
    { key: 'rider', header: 'Rider', render: (o) => <span className="text-ink-soft">{o.rider?.user?.name ?? '—'}</span> },
    { key: 'total', header: 'Total', align: 'right', render: (o) => <span className="font-medium text-ink">{inr(o.total)}</span> },
  ];

  return (
    <div>
      <PageHeader title="Orders" subtitle="All orders across grocery, pharmacy, food and parcel." />
      <Card>
        <Toolbar>
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search order # or customer…" />
          <div className="flex flex-wrap gap-2">
            <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="w-full sm:w-44">
              <option value="">All statuses</option>
              {Object.values(OrderStatus).map((s) => (
                <option key={s} value={s}>{titleCase(s)}</option>
              ))}
            </Select>
            <Select value={serviceType} onChange={(e) => { setServiceType(e.target.value); setPage(1); }} className="w-full sm:w-40">
              <option value="">All services</option>
              {Object.values(ServiceType).map((s) => (
                <option key={s} value={s}>{titleCase(s)}</option>
              ))}
            </Select>
          </div>
        </Toolbar>

        <DataTable
          columns={columns}
          rows={data?.items}
          keyField={(o) => o.id}
          loading={isLoading || isFetching}
          error={isError ? (error as Error).message : null}
          onRetry={refetch}
          onRowClick={(o) => router.push(`/orders/${o.id}`)}
          emptyTitle="No orders found"
          emptyMessage="Try changing the filters or search term."
        />
        {data && <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onPage={setPage} />}
      </Card>
    </div>
  );
}
