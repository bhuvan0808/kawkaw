'use client';

import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge, Button, Card, EmptyState, Input, Label, PageHeader, Select } from '@/components/ui/primitives';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/cn';
import { dateTime, titleCase } from '@/lib/format';
import { useAdmins, useCreateAdmin } from '@/lib/queries';
import type { Admin } from '@/lib/types';
import { UserRole } from '@kawkaw/shared-types';
import { useState } from 'react';

const ADMIN_ROLES: UserRole[] = [UserRole.ADMIN, UserRole.SUPPORT, UserRole.SUPER_ADMIN];

function roleColor(role: string): string {
  const map: Record<string, string> = {
    [UserRole.SUPER_ADMIN]: 'bg-violet-100 text-violet-700',
    [UserRole.ADMIN]: 'bg-brand-100 text-brand-700',
    [UserRole.SUPPORT]: 'bg-blue-100 text-blue-700',
  };
  return map[role] ?? 'bg-slate-100 text-slate-700';
}

export default function AdminsPage() {
  const { hasRole } = useAuth();
  const toast = useToast();
  const { data, isLoading, isError, error, refetch } = useAdmins();
  const create = useCreateAdmin();

  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.ADMIN);
  const [department, setDepartment] = useState('');

  if (!hasRole(UserRole.SUPER_ADMIN)) {
    return (
      <div>
        <PageHeader title="Admins" subtitle="Manage admin accounts." />
        <Card>
          <EmptyState title="Restricted" message="Only super admins can manage admin accounts." />
        </Card>
      </div>
    );
  }

  function reset() {
    setPhone('');
    setName('');
    setRole(UserRole.ADMIN);
    setDepartment('');
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) {
      toast.error('Phone number is required.');
      return;
    }
    create.mutate(
      {
        phone: phone.trim(),
        name: name.trim() || undefined,
        role,
        department: department.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Admin added');
          setOpen(false);
          reset();
        },
        onError: (err) => toast.error((err as Error).message || 'Could not add admin.'),
      },
    );
  }

  const columns: Column<Admin>[] = [
    {
      key: 'name',
      header: 'Admin',
      render: (a) => (
        <div>
          <p className="font-medium text-ink">{a.user?.name ?? '—'}</p>
          <p className="text-xs text-ink-muted">{a.user?.phone}</p>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (a) => <Badge className={roleColor(a.user?.role ?? '')}>{a.user?.role ? titleCase(a.user.role) : '—'}</Badge>,
    },
    { key: 'department', header: 'Department', render: (a) => <span className="text-ink-soft">{a.department ?? '—'}</span> },
    {
      key: 'active',
      header: 'Status',
      render: (a) => (
        <Badge className={a.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}>
          {a.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    { key: 'createdAt', header: 'Added', align: 'right', render: (a) => <span className="text-ink-muted">{dateTime(a.createdAt)}</span> },
  ];

  return (
    <div>
      <PageHeader
        title="Admins"
        subtitle="Staff with access to this console."
        action={<Button onClick={() => setOpen(true)}>Add admin</Button>}
      />
      <Card>
        <DataTable
          columns={columns}
          rows={data}
          keyField={(a) => a.id}
          loading={isLoading}
          error={isError ? (error as Error).message : null}
          onRetry={refetch}
          emptyTitle="No admins yet"
          emptyMessage="Add your first admin to grant console access."
        />
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add admin"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={create.isPending}>
              Cancel
            </Button>
            <Button type="submit" form="add-admin-form" loading={create.isPending}>
              Add admin
            </Button>
          </>
        }
      >
        <form id="add-admin-form" onSubmit={submit} className="space-y-4">
          <p className={cn('rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800')}>
            This creates the user (or elevates an existing one) with the selected admin role.
          </p>
          <div>
            <Label htmlFor="ad-phone">Phone</Label>
            <Input id="ad-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" />
            <p className="mt-1 text-xs text-ink-muted">Use the full number with country code (+91).</p>
          </div>
          <div>
            <Label htmlFor="ad-name">Name</Label>
            <Input id="ad-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
          </div>
          <div>
            <Label htmlFor="ad-role">Role</Label>
            <Select id="ad-role" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
              {ADMIN_ROLES.map((r) => (
                <option key={r} value={r}>{titleCase(r)}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="ad-dept">Department</Label>
            <Input id="ad-dept" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Operations" />
          </div>
        </form>
      </Modal>
    </div>
  );
}
