'use client';

import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { DataTable, Toolbar, type Column } from '@/components/ui/DataTable';
import {
  Badge,
  Button,
  Card,
  Input,
  Label,
  PageHeader,
  Select,
  Textarea,
} from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/cn';
import { titleCase } from '@/lib/format';
import {
  useCategories,
  useDeleteCategory,
  useSaveCategory,
  type CategoryInput,
} from '@/lib/queries';
import type { Category } from '@/lib/types';
import { ServiceType, UserRole } from '@kawkaw/shared-types';
import { useState } from 'react';

export default function CategoriesPage() {
  const { hasRole } = useAuth();
  const toast = useToast();
  const canManage = hasRole(UserRole.ADMIN, UserRole.SUPER_ADMIN);

  const [serviceType, setServiceType] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [toDelete, setToDelete] = useState<Category | null>(null);

  const { data, isLoading, isFetching, isError, error, refetch } = useCategories(serviceType || undefined);
  const deleteCategory = useDeleteCategory();

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (c: Category) => {
    setEditing(c);
    setFormOpen(true);
  };

  const doDelete = () => {
    if (!toDelete) return;
    deleteCategory.mutate(toDelete.id, {
      onSuccess: () => {
        toast.success('Category deleted');
        setToDelete(null);
      },
      onError: (e) => toast.error((e as Error).message),
    });
  };

  const columns: Column<Category>[] = [
    {
      key: 'name',
      header: 'Category',
      render: (c) => (
        <div>
          <p className="font-medium text-ink">{c.name}</p>
          <p className="text-xs text-ink-muted">{c.slug}</p>
        </div>
      ),
    },
    { key: 'serviceType', header: 'Service', render: (c) => <span className="text-ink-soft">{titleCase(c.serviceType)}</span> },
    { key: 'sortOrder', header: 'Sort', align: 'right', render: (c) => <span className="text-ink-soft">{c.sortOrder}</span> },
    {
      key: 'isActive',
      header: 'Status',
      render: (c) => (
        <Badge className={c.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}>
          {c.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (c) => (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => openEdit(c)}>
            Edit
          </Button>
          <Button variant="danger" size="sm" disabled={!canManage} onClick={() => setToDelete(c)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Categories"
        subtitle="Organise the catalogue per service."
        action={canManage ? <Button onClick={openCreate}>New category</Button> : undefined}
      />
      <Card>
        <Toolbar>
          <Select value={serviceType} onChange={(e) => setServiceType(e.target.value)} className="w-full sm:w-44">
            <option value="">All services</option>
            {Object.values(ServiceType).map((s) => (
              <option key={s} value={s}>
                {titleCase(s)}
              </option>
            ))}
          </Select>
        </Toolbar>

        <DataTable
          columns={columns}
          rows={data}
          keyField={(c) => c.id}
          loading={isLoading || isFetching}
          error={isError ? (error as Error).message : null}
          onRetry={refetch}
          emptyTitle="No categories"
          emptyMessage="Create a category to start organising products."
        />
      </Card>

      <CategoryFormModal
        key={editing?.id ?? 'new'}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        category={editing}
        defaultServiceType={serviceType || undefined}
        siblings={data ?? []}
        onSaved={() => setFormOpen(false)}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={doDelete}
        title="Delete category"
        message={`Delete “${toDelete?.name ?? ''}”? Products in it will need re-categorising.`}
        confirmLabel="Delete"
        danger
        loading={deleteCategory.isPending}
      />
    </div>
  );
}

// --------------------------------------------------------------- form modal

interface FormState {
  name: string;
  serviceType: string;
  description: string;
  imageUrl: string;
  sortOrder: string;
  isActive: boolean;
  parentId: string;
}

function emptyForm(defaultServiceType?: string): FormState {
  return {
    name: '',
    serviceType: defaultServiceType || ServiceType.GROCERY,
    description: '',
    imageUrl: '',
    sortOrder: '0',
    isActive: true,
    parentId: '',
  };
}

function fromCategory(c: Category): FormState {
  return {
    name: c.name,
    serviceType: c.serviceType,
    description: c.description ?? '',
    imageUrl: c.imageUrl ?? '',
    sortOrder: String(c.sortOrder ?? 0),
    isActive: c.isActive,
    parentId: c.parentId ?? '',
  };
}

function CategoryFormModal({
  open,
  onClose,
  category,
  defaultServiceType,
  siblings,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  category: Category | null;
  defaultServiceType?: string;
  siblings: Category[];
  onSaved: () => void;
}) {
  const toast = useToast();
  const save = useSaveCategory();
  const isEdit = Boolean(category);
  const [form, setForm] = useState<FormState>(() =>
    category ? fromCategory(category) : emptyForm(defaultServiceType),
  );

  // Categories of the selected service usable as a parent (cannot parent itself).
  const { data: serviceCategories } = useCategories(form.serviceType || undefined);
  const parentOptions = (serviceCategories ?? siblings).filter((c) => c.id !== category?.id);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const submit = () => {
    if (!form.name.trim()) {
      toast.error('Name is required.');
      return;
    }
    const input: Partial<CategoryInput> = {
      name: form.name.trim(),
      serviceType: form.serviceType,
      description: form.description.trim() || undefined,
      imageUrl: form.imageUrl.trim() || undefined,
      sortOrder: form.sortOrder.trim() ? Number(form.sortOrder) : undefined,
      isActive: form.isActive,
      parentId: form.parentId || undefined,
    };

    save.mutate(
      { id: category?.id, input },
      {
        onSuccess: () => {
          toast.success(isEdit ? 'Category updated' : 'Category created');
          onSaved();
        },
        onError: (e) => toast.error((e as Error).message),
      },
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit category' : 'New category'}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button onClick={submit} loading={save.isPending}>
            {isEdit ? 'Save changes' : 'Create category'}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="c-name">Name</Label>
          <Input id="c-name" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Category name" />
        </div>
        <div>
          <Label htmlFor="c-service">Service type</Label>
          <Select
            id="c-service"
            value={form.serviceType}
            onChange={(e) => set('serviceType', e.target.value)}
          >
            {Object.values(ServiceType).map((s) => (
              <option key={s} value={s}>
                {titleCase(s)}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="c-sort">Sort order</Label>
          <Input
            id="c-sort"
            type="number"
            step="1"
            value={form.sortOrder}
            onChange={(e) => set('sortOrder', e.target.value)}
            placeholder="0"
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="c-parent">Parent category</Label>
          <Select id="c-parent" value={form.parentId} onChange={(e) => set('parentId', e.target.value)}>
            <option value="">— none —</option>
            {parentOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="c-image">Image URL</Label>
          <Input id="c-image" value={form.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} placeholder="https://…" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="c-desc">Description</Label>
          <Textarea
            id="c-desc"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Short description"
          />
        </div>
      </div>

      <div className="mt-4">
        <label className={cn('inline-flex cursor-pointer items-center gap-2 text-sm text-ink-soft')}>
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => set('isActive', e.target.checked)}
            className="h-4 w-4 rounded border-surface-border text-brand-600 focus:ring-brand/30"
          />
          Active
        </label>
      </div>
    </Modal>
  );
}
