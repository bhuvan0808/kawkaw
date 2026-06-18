'use client';

import { DataTable, Pagination, SearchInput, Toolbar, type Column } from '@/components/ui/DataTable';
import { Button, Card, PageHeader, Select } from '@/components/ui/primitives';
import { Modal } from '@/components/ui/Modal';
import { dateTime, titleCase } from '@/lib/format';
import { useAuditLogs } from '@/lib/queries';
import type { AuditLog } from '@/lib/types';
import { useState } from 'react';

const PAGE_SIZE = 25;

const ENTITY_TYPES = [
  'Order',
  'User',
  'Rider',
  'PrescriptionUpload',
  'Notification',
  'Product',
  'Category',
  'Admin',
  'Setting',
];

function JsonBlock({ label, value }: { label: string; value: unknown }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</p>
      <pre className="scrollbar-thin max-h-72 overflow-auto rounded-lg border border-surface-border bg-surface-subtle p-3 text-xs text-ink-soft">
        {value == null ? '—' : JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

export default function AuditPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [entityType, setEntityType] = useState('');
  const [selected, setSelected] = useState<AuditLog | null>(null);

  const { data, isLoading, isFetching, isError, error, refetch } = useAuditLogs({
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
    entityType: entityType || undefined,
  });

  const columns: Column<AuditLog>[] = [
    {
      key: 'action',
      header: 'Action',
      render: (l) => <span className="font-mono text-xs font-medium text-ink">{titleCase(l.action)}</span>,
    },
    {
      key: 'entity',
      header: 'Entity',
      render: (l) => (
        <div>
          <p className="text-ink-soft">{l.entityType}</p>
          {l.entityId && <p className="font-mono text-[11px] text-ink-muted">{l.entityId.slice(0, 8)}</p>}
        </div>
      ),
    },
    {
      key: 'actor',
      header: 'Actor',
      render: (l) => (
        <div>
          <p className="text-ink-soft">{l.actor?.name ?? 'system'}</p>
          {l.actor?.role && <p className="text-[11px] text-ink-muted">{titleCase(l.actor.role)}</p>}
        </div>
      ),
    },
    { key: 'when', header: 'When', render: (l) => <span className="text-ink-muted">{dateTime(l.createdAt)}</span> },
    {
      key: 'details',
      header: '',
      align: 'right',
      render: (l) => (
        <Button variant="outline" size="sm" onClick={() => setSelected(l)}>
          Details
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Audit Log" subtitle="Every privileged action across the platform, recorded." />
      <Card>
        <Toolbar>
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search by action…" />
          <Select value={entityType} onChange={(e) => { setEntityType(e.target.value); setPage(1); }} className="w-full sm:w-52">
            <option value="">All entities</option>
            {ENTITY_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
        </Toolbar>

        <DataTable
          columns={columns}
          rows={data?.items}
          keyField={(l) => l.id}
          loading={isLoading || isFetching}
          error={isError ? (error as Error).message : null}
          onRetry={refetch}
          emptyTitle="No audit entries"
          emptyMessage="Try changing the filters or search term."
        />
        {data && <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onPage={setPage} />}
      </Card>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? titleCase(selected.action) : 'Audit entry'}
        size="lg"
      >
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Entity</p>
                <p className="text-ink-soft">{selected.entityType}{selected.entityId ? ` · ${selected.entityId}` : ''}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Actor</p>
                <p className="text-ink-soft">{selected.actor?.name ?? 'system'}{selected.actor?.role ? ` (${titleCase(selected.actor.role)})` : ''}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">When</p>
                <p className="text-ink-soft">{dateTime(selected.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">IP</p>
                <p className="text-ink-soft">{selected.ipAddress ?? '—'}</p>
              </div>
            </div>
            <JsonBlock label="Before" value={selected.before} />
            <JsonBlock label="After" value={selected.after} />
          </div>
        )}
      </Modal>
    </div>
  );
}
