'use client';

import { DataTable, Pagination, SearchInput, Toolbar, type Column } from '@/components/ui/DataTable';
import { Badge, Button, Card, CardHeader, Input, Label, PageHeader, Select, Textarea } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { relativeTime, titleCase } from '@/lib/format';
import { useBroadcast, useNotificationHistory } from '@/lib/queries';
import type { AuditLog } from '@/lib/types';
import { NotificationType } from '@kawkaw/shared-types';
import { useState } from 'react';

const PAGE_SIZE = 15;

/** The audited `after` payload for a broadcast is unstructured JSON; read it defensively. */
function payload(log: AuditLog): Record<string, unknown> {
  const a = log.after;
  return a && typeof a === 'object' ? (a as Record<string, unknown>) : {};
}

function str(v: unknown): string {
  return v == null ? '—' : String(v);
}

export default function NotificationsPage() {
  const toast = useToast();
  const broadcast = useBroadcast();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState<NotificationType>(NotificationType.PROMOTION);
  const [audience, setAudience] = useState<'' | 'CUSTOMER' | 'RIDER'>('');

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { data, isLoading, isFetching, isError, error, refetch } = useNotificationHistory({
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error('Title and message are required.');
      return;
    }
    broadcast.mutate(
      { type, title: title.trim(), body: body.trim(), role: audience || undefined },
      {
        onSuccess: () => {
          toast.success('Broadcast sent');
          setTitle('');
          setBody('');
          setType(NotificationType.PROMOTION);
          setAudience('');
        },
        onError: (err) => toast.error((err as Error).message || 'Could not send broadcast.'),
      },
    );
  }

  const columns: Column<AuditLog>[] = [
    {
      key: 'title',
      header: 'Title',
      render: (l) => {
        const p = payload(l);
        return (
          <div>
            <p className="font-medium text-ink">{str(p.title)}</p>
            <p className="line-clamp-1 max-w-xs text-xs text-ink-muted">{str(p.body)}</p>
          </div>
        );
      },
    },
    { key: 'audience', header: 'Audience', render: (l) => <span className="text-ink-soft">{str(payload(l).audience)}</span> },
    {
      key: 'type',
      header: 'Type',
      render: (l) => {
        const t = payload(l).type;
        return <Badge className="bg-brand-100 text-brand-700">{t ? titleCase(String(t)) : '—'}</Badge>;
      },
    },
    { key: 'sentBy', header: 'Sent by', render: (l) => <span className="text-ink-soft">{l.actor?.name ?? 'System'}</span> },
    { key: 'when', header: 'When', align: 'right', render: (l) => <span className="text-ink-muted">{relativeTime(l.createdAt)}</span> },
  ];

  return (
    <div>
      <PageHeader title="Notifications" subtitle="Broadcast push notifications and review send history." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title="Broadcast" subtitle="Send a push to customers or riders." />
          <form onSubmit={submit} className="space-y-4 p-5">
            <div>
              <Label htmlFor="nt-title">Title</Label>
              <Input id="nt-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Weekend offer" maxLength={120} />
            </div>
            <div>
              <Label htmlFor="nt-body">Message</Label>
              <Textarea id="nt-body" value={body} onChange={(e) => setBody(e.target.value)} placeholder="What do you want to tell them?" />
            </div>
            <div>
              <Label htmlFor="nt-type">Type</Label>
              <Select id="nt-type" value={type} onChange={(e) => setType(e.target.value as NotificationType)}>
                {Object.values(NotificationType).map((t) => (
                  <option key={t} value={t}>{titleCase(t)}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="nt-audience">Audience</Label>
              <Select id="nt-audience" value={audience} onChange={(e) => setAudience(e.target.value as '' | 'CUSTOMER' | 'RIDER')}>
                <option value="">All customers</option>
                <option value="CUSTOMER">Customers</option>
                <option value="RIDER">Riders</option>
              </Select>
            </div>
            <Button type="submit" loading={broadcast.isPending} className="w-full">
              Send broadcast
            </Button>
          </form>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="History" subtitle="Recent broadcasts and sends." />
          <Toolbar>
            <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search history…" />
          </Toolbar>
          <DataTable
            columns={columns}
            rows={data?.items}
            keyField={(l) => l.id}
            loading={isLoading || isFetching}
            error={isError ? (error as Error).message : null}
            onRetry={refetch}
            emptyTitle="No notifications yet"
            emptyMessage="Broadcasts you send will appear here."
          />
          {data && <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onPage={setPage} />}
        </Card>
      </div>
    </div>
  );
}
