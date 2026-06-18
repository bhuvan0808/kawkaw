'use client';

import { DataTable, Pagination, SearchInput, Toolbar, type Column } from '@/components/ui/DataTable';
import { ConfirmDialog } from '@/components/ui/Modal';
import { Badge, Button, Card, PageHeader, Select } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/cn';
import { dateTime, initials, num, riderStatusColor, titleCase } from '@/lib/format';
import { useRiders, useSetUserActive, useUsers, useVerifyRider } from '@/lib/queries';
import type { Rider, User } from '@/lib/types';
import { RiderStatus, UserRole } from '@kawkaw/shared-types';
import { useState } from 'react';

const PAGE_SIZE = 20;

type Tab = 'customers' | 'riders';

export default function UsersPage() {
  const [tab, setTab] = useState<Tab>('customers');

  const switchTab = (next: Tab) => {
    if (next !== tab) setTab(next);
  };

  return (
    <div>
      <PageHeader title="Users & Riders" subtitle="Manage customer accounts and delivery riders." />

      <div className="mb-4 inline-flex rounded-lg border border-surface-border bg-white p-1 shadow-card">
        <TabButton active={tab === 'customers'} onClick={() => switchTab('customers')}>
          Customers
        </TabButton>
        <TabButton active={tab === 'riders'} onClick={() => switchTab('riders')}>
          Riders
        </TabButton>
      </div>

      {tab === 'customers' ? <CustomersTab /> : <RidersTab />}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
        active ? 'bg-brand-600 text-white' : 'text-ink-soft hover:bg-surface-subtle',
      )}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------- Customers
function CustomersTab() {
  const { success, error: toastError } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [target, setTarget] = useState<User | null>(null);

  const { data, isLoading, isFetching, isError, error, refetch } = useUsers({
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
    role: UserRole.CUSTOMER,
  });

  const setActive = useSetUserActive();

  const confirmToggle = () => {
    if (!target) return;
    const nextActive = !target.isActive;
    setActive.mutate(
      { id: target.id, isActive: nextActive },
      {
        onSuccess: () => {
          success(nextActive ? 'Customer reactivated' : 'Customer suspended');
          setTarget(null);
        },
        onError: (e) => toastError((e as Error).message),
      },
    );
  };

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'Customer',
      render: (u) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600/10 text-xs font-semibold text-brand-600">
            {initials(u.name, u.phone)}
          </span>
          <span className="font-medium text-ink">{u.name ?? '—'}</span>
        </div>
      ),
    },
    { key: 'phone', header: 'Phone', render: (u) => <span className="text-ink-soft">{u.phone}</span> },
    { key: 'email', header: 'Email', render: (u) => <span className="text-ink-soft">{u.email ?? '—'}</span> },
    {
      key: 'isActive',
      header: 'Status',
      render: (u) => (
        <Badge className={u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
          {u.isActive ? 'Active' : 'Suspended'}
        </Badge>
      ),
    },
    { key: 'createdAt', header: 'Joined', render: (u) => <span className="text-ink-soft">{dateTime(u.createdAt)}</span> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (u) => (
        <Button variant={u.isActive ? 'danger' : 'primary'} size="sm" onClick={() => setTarget(u)}>
          {u.isActive ? 'Suspend' : 'Reactivate'}
        </Button>
      ),
    },
  ];

  return (
    <Card>
      <Toolbar>
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search name, phone or email…"
        />
      </Toolbar>

      <DataTable
        columns={columns}
        rows={data?.items}
        keyField={(u) => u.id}
        loading={isLoading || isFetching}
        error={isError ? (error as Error).message : null}
        onRetry={refetch}
        emptyTitle="No customers found"
        emptyMessage="Try changing the search term."
      />
      {data && <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onPage={setPage} />}

      <ConfirmDialog
        open={Boolean(target)}
        onClose={() => setTarget(null)}
        onConfirm={confirmToggle}
        title={target?.isActive ? 'Suspend customer' : 'Reactivate customer'}
        message={
          target?.isActive
            ? `Suspend ${target?.name ?? target?.phone}? They will lose access until reactivated.`
            : `Reactivate ${target?.name ?? target?.phone}? They will regain account access.`
        }
        confirmLabel={target?.isActive ? 'Suspend' : 'Reactivate'}
        danger={target?.isActive}
        loading={setActive.isPending}
      />
    </Card>
  );
}

// ---------------------------------------------------------------- Riders
type RiderAction =
  | { kind: 'verify'; rider: Rider }
  | { kind: 'suspend'; rider: Rider };

function RidersTab() {
  const { hasRole } = useAuth();
  const { success, error: toastError } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [action, setAction] = useState<RiderAction | null>(null);

  // hasRole referenced so role-derived UI stays consistent with shared conventions.
  void hasRole;

  const { data, isLoading, isFetching, isError, error, refetch } = useRiders({
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
    status: status || undefined,
  });

  const verifyRider = useVerifyRider();
  const setActive = useSetUserActive();

  const confirmAction = () => {
    if (!action) return;
    if (action.kind === 'verify') {
      const next = !action.rider.isVerified;
      verifyRider.mutate(
        { riderId: action.rider.id, isVerified: next },
        {
          onSuccess: () => {
            success(next ? 'Rider verified' : 'Rider verification revoked');
            setAction(null);
          },
          onError: (e) => toastError((e as Error).message),
        },
      );
    } else {
      const user = action.rider.user;
      if (!user) return;
      const next = !user.isActive;
      setActive.mutate(
        { id: user.id, isActive: next },
        {
          onSuccess: () => {
            success(next ? 'Rider reactivated' : 'Rider suspended');
            setAction(null);
          },
          onError: (e) => toastError((e as Error).message),
        },
      );
    }
  };

  const columns: Column<Rider>[] = [
    {
      key: 'name',
      header: 'Rider',
      render: (r) => (
        <div>
          <p className="font-medium text-ink">{r.user?.name ?? '—'}</p>
          <p className="text-xs text-ink-muted">{r.user?.phone ?? '—'}</p>
        </div>
      ),
    },
    {
      key: 'vehicle',
      header: 'Vehicle',
      render: (r) => (
        <div>
          <p className="text-ink-soft">{r.vehicleType ? titleCase(r.vehicleType) : '—'}</p>
          <p className="text-xs text-ink-muted">{r.vehicleNumber ?? '—'}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium', riderStatusColor(r.status))}>
          {titleCase(r.status)}
        </span>
      ),
    },
    {
      key: 'isVerified',
      header: 'Verified',
      render: (r) => (
        <Badge className={r.isVerified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
          {r.isVerified ? 'Verified' : 'Unverified'}
        </Badge>
      ),
    },
    {
      key: 'rating',
      header: 'Rating',
      align: 'right',
      render: (r) => (
        <div className="text-right">
          <p className="font-medium text-ink">{r.rating.toFixed(1)}★</p>
          <p className="text-xs text-ink-muted">{num(r.totalDeliveries)} deliveries</p>
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) => (
        <div className="flex justify-end gap-2">
          <Button
            variant={r.isVerified ? 'outline' : 'primary'}
            size="sm"
            onClick={() => setAction({ kind: 'verify', rider: r })}
          >
            {r.isVerified ? 'Unverify' : 'Verify'}
          </Button>
          {r.user && (
            <Button
              variant={r.user.isActive ? 'danger' : 'secondary'}
              size="sm"
              onClick={() => setAction({ kind: 'suspend', rider: r })}
            >
              {r.user.isActive ? 'Suspend' : 'Reactivate'}
            </Button>
          )}
        </div>
      ),
    },
  ];

  const dialog = (() => {
    if (!action) return { title: '', message: '', confirmLabel: 'Confirm', danger: false };
    const name = action.rider.user?.name ?? action.rider.user?.phone ?? 'this rider';
    if (action.kind === 'verify') {
      const next = !action.rider.isVerified;
      return {
        title: next ? 'Verify rider' : 'Revoke verification',
        message: next
          ? `Mark ${name} as a verified rider?`
          : `Revoke verification for ${name}? They may be restricted from taking deliveries.`,
        confirmLabel: next ? 'Verify' : 'Unverify',
        danger: !next,
      };
    }
    const nextActive = !action.rider.user?.isActive;
    return {
      title: nextActive ? 'Reactivate rider' : 'Suspend rider',
      message: nextActive
        ? `Reactivate ${name}'s account? They will regain access.`
        : `Suspend ${name}'s account? They will be unable to log in or take deliveries.`,
      confirmLabel: nextActive ? 'Reactivate' : 'Suspend',
      danger: !nextActive,
    };
  })();

  return (
    <Card>
      <Toolbar>
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search rider name or phone…"
        />
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="w-full sm:w-44"
        >
          <option value="">All statuses</option>
          {Object.values(RiderStatus).map((s) => (
            <option key={s} value={s}>
              {titleCase(s)}
            </option>
          ))}
        </Select>
      </Toolbar>

      <DataTable
        columns={columns}
        rows={data?.items}
        keyField={(r) => r.id}
        loading={isLoading || isFetching}
        error={isError ? (error as Error).message : null}
        onRetry={refetch}
        emptyTitle="No riders found"
        emptyMessage="Try changing the filters or search term."
      />
      {data && <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onPage={setPage} />}

      <ConfirmDialog
        open={Boolean(action)}
        onClose={() => setAction(null)}
        onConfirm={confirmAction}
        title={dialog.title}
        message={dialog.message}
        confirmLabel={dialog.confirmLabel}
        danger={dialog.danger}
        loading={verifyRider.isPending || setActive.isPending}
      />
    </Card>
  );
}
