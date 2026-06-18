'use client';

import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { DataTable, Pagination, SearchInput, Toolbar, type Column } from '@/components/ui/DataTable';
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
import { inr, titleCase } from '@/lib/format';
import {
  useCategories,
  useDeleteProduct,
  useProducts,
  useSaveProduct,
  type ProductInput,
} from '@/lib/queries';
import type { Category, Product } from '@/lib/types';
import { ServiceType, UserRole } from '@kawkaw/shared-types';
import { useState } from 'react';

const PAGE_SIZE = 20;

export default function ProductsPage() {
  const { hasRole } = useAuth();
  const toast = useToast();
  const canManage = hasRole(UserRole.ADMIN, UserRole.SUPER_ADMIN);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [toDelete, setToDelete] = useState<Product | null>(null);

  const { data, isLoading, isFetching, isError, error, refetch } = useProducts({
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
    serviceType: serviceType || undefined,
    categoryId: categoryId || undefined,
  });

  // Categories used to power the filter dropdown (scoped to the chosen service).
  const { data: filterCategories } = useCategories(serviceType || undefined);
  const deleteProduct = useDeleteProduct();

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (p: Product) => {
    setEditing(p);
    setFormOpen(true);
  };

  const doDelete = () => {
    if (!toDelete) return;
    deleteProduct.mutate(toDelete.id, {
      onSuccess: () => {
        toast.success('Product deleted');
        setToDelete(null);
      },
      onError: (e) => toast.error((e as Error).message),
    });
  };

  const columns: Column<Product>[] = [
    {
      key: 'name',
      header: 'Product',
      render: (p) => (
        <div>
          <p className="font-medium text-ink">{p.name}</p>
          <p className="text-xs text-ink-muted">{p.sku}</p>
        </div>
      ),
    },
    { key: 'category', header: 'Category', render: (p) => <span className="text-ink-soft">{p.category?.name ?? '—'}</span> },
    { key: 'serviceType', header: 'Service', render: (p) => <span className="text-ink-soft">{titleCase(p.serviceType)}</span> },
    {
      key: 'price',
      header: 'Price',
      align: 'right',
      render: (p) => {
        const price = Number(p.price);
        const mrp = Number(p.mrp);
        return (
          <div className="text-right">
            <span className="font-medium text-ink">{inr(p.price)}</span>
            {mrp > price && <span className="ml-1 text-xs text-ink-muted line-through">{inr(p.mrp)}</span>}
          </div>
        );
      },
    },
    {
      key: 'stock',
      header: 'Stock',
      align: 'right',
      render: (p) => {
        const qty = p.inventory?.quantity;
        const threshold = p.inventory?.lowStockThreshold ?? 0;
        if (qty == null) return <span className="text-ink-muted">—</span>;
        const low = qty <= threshold;
        return low ? (
          <Badge className="bg-amber-100 text-amber-700">{qty} low</Badge>
        ) : (
          <span className="text-ink-soft">{qty}</span>
        );
      },
    },
    {
      key: 'flags',
      header: 'Status',
      render: (p) => (
        <div className="flex flex-wrap gap-1">
          <Badge className={p.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}>
            {p.isActive ? 'Active' : 'Inactive'}
          </Badge>
          {p.isFeatured && <Badge className="bg-brand-100 text-brand-700">Featured</Badge>}
          {p.requiresPrescription && <Badge className="bg-violet-100 text-violet-700">Rx</Badge>}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (p) => (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => openEdit(p)}>
            Edit
          </Button>
          <Button variant="danger" size="sm" disabled={!canManage} onClick={() => setToDelete(p)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle="Catalogue across grocery, pharmacy, food and parcel."
        action={
          canManage ? (
            <Button onClick={openCreate}>New product</Button>
          ) : undefined
        }
      />
      <Card>
        <Toolbar>
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search name or SKU…"
          />
          <div className="flex flex-wrap gap-2">
            <Select
              value={serviceType}
              onChange={(e) => {
                setServiceType(e.target.value);
                setCategoryId('');
                setPage(1);
              }}
              className="w-full sm:w-40"
            >
              <option value="">All services</option>
              {Object.values(ServiceType).map((s) => (
                <option key={s} value={s}>
                  {titleCase(s)}
                </option>
              ))}
            </Select>
            <Select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setPage(1);
              }}
              className="w-full sm:w-48"
            >
              <option value="">All categories</option>
              {(filterCategories ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
        </Toolbar>

        <DataTable
          columns={columns}
          rows={data?.items}
          keyField={(p) => p.id}
          loading={isLoading || isFetching}
          error={isError ? (error as Error).message : null}
          onRetry={refetch}
          emptyTitle="No products found"
          emptyMessage="Try changing the filters or create a new product."
        />
        {data && <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onPage={setPage} />}
      </Card>

      <ProductFormModal
        key={editing?.id ?? 'new'}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        product={editing}
        onSaved={() => setFormOpen(false)}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={doDelete}
        title="Delete product"
        message={`Delete “${toDelete?.name ?? ''}”? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={deleteProduct.isPending}
      />
    </div>
  );
}

// --------------------------------------------------------------- form modal

interface FormState {
  name: string;
  sku: string;
  serviceType: string;
  categoryId: string;
  price: string;
  mrp: string;
  unit: string;
  description: string;
  imageUrl: string;
  images: string[];
  isActive: boolean;
  isFeatured: boolean;
  requiresPrescription: boolean;
  initialStock: string;
}

function emptyForm(): FormState {
  return {
    name: '',
    sku: '',
    serviceType: ServiceType.GROCERY,
    categoryId: '',
    price: '',
    mrp: '',
    unit: '',
    description: '',
    imageUrl: '',
    images: [],
    isActive: true,
    isFeatured: false,
    requiresPrescription: false,
    initialStock: '',
  };
}

function fromProduct(p: Product): FormState {
  return {
    name: p.name,
    sku: p.sku,
    serviceType: p.serviceType,
    categoryId: p.categoryId,
    price: String(p.price ?? ''),
    mrp: String(p.mrp ?? ''),
    unit: p.unit ?? '',
    description: p.description ?? '',
    imageUrl: p.imageUrl ?? '',
    images: p.images ?? [],
    isActive: p.isActive,
    isFeatured: p.isFeatured,
    requiresPrescription: p.requiresPrescription,
    initialStock: '',
  };
}

function ProductFormModal({
  open,
  onClose,
  product,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  product: Product | null;
  onSaved: () => void;
}) {
  const toast = useToast();
  const save = useSaveProduct();
  const isEdit = Boolean(product);
  const [form, setForm] = useState<FormState>(() => (product ? fromProduct(product) : emptyForm()));

  // Categories scoped to the currently selected service type.
  const { data: categories } = useCategories(form.serviceType || undefined);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const setImageAt = (idx: number, value: string) =>
    setForm((f) => ({ ...f, images: f.images.map((u, i) => (i === idx ? value : u)) }));
  const addImage = () => setForm((f) => ({ ...f, images: [...f.images, ''] }));
  const removeImage = (idx: number) => setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));

  const submit = () => {
    if (!form.name.trim() || !form.sku.trim() || !form.categoryId) {
      toast.error('Name, SKU and category are required.');
      return;
    }
    const input: Partial<ProductInput> = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      serviceType: form.serviceType,
      categoryId: form.categoryId,
      price: Number(form.price),
      mrp: Number(form.mrp),
      unit: form.unit.trim() || undefined,
      description: form.description.trim() || undefined,
      imageUrl: form.imageUrl.trim() || undefined,
      images: form.images.map((u) => u.trim()).filter(Boolean),
      isActive: form.isActive,
      isFeatured: form.isFeatured,
      requiresPrescription: form.requiresPrescription,
    };
    if (!isEdit && form.initialStock.trim()) {
      input.initialStock = Number(form.initialStock);
    }

    save.mutate(
      { id: product?.id, input },
      {
        onSuccess: () => {
          toast.success(isEdit ? 'Product updated' : 'Product created');
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
      title={isEdit ? 'Edit product' : 'New product'}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button onClick={submit} loading={save.isPending}>
            {isEdit ? 'Save changes' : 'Create product'}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="p-name">Name</Label>
          <Input id="p-name" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Product name" />
        </div>
        <div>
          <Label htmlFor="p-sku">SKU</Label>
          <Input id="p-sku" value={form.sku} onChange={(e) => set('sku', e.target.value)} placeholder="SKU-0001" />
        </div>
        <div>
          <Label htmlFor="p-service">Service type</Label>
          <Select
            id="p-service"
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
          <Label htmlFor="p-category">Category</Label>
          <Select id="p-category" value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
            <option value="">Select a category…</option>
            {(categories ?? []).map((c: Category) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="p-price">Price (₹)</Label>
          <Input
            id="p-price"
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={(e) => set('price', e.target.value)}
            placeholder="0"
          />
        </div>
        <div>
          <Label htmlFor="p-mrp">MRP (₹)</Label>
          <Input
            id="p-mrp"
            type="number"
            min="0"
            step="0.01"
            value={form.mrp}
            onChange={(e) => set('mrp', e.target.value)}
            placeholder="0"
          />
        </div>
        <div>
          <Label htmlFor="p-unit">Unit</Label>
          <Input id="p-unit" value={form.unit} onChange={(e) => set('unit', e.target.value)} placeholder="e.g. 500g, 1L, piece" />
        </div>
        {!isEdit && (
          <div>
            <Label htmlFor="p-stock">Initial stock</Label>
            <Input
              id="p-stock"
              type="number"
              min="0"
              step="1"
              value={form.initialStock}
              onChange={(e) => set('initialStock', e.target.value)}
              placeholder="0"
            />
          </div>
        )}
      </div>

      <div className="mt-4">
        <Label htmlFor="p-desc">Description</Label>
        <Textarea
          id="p-desc"
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Short product description"
        />
      </div>

      <div className="mt-4">
        <Label htmlFor="p-image">Primary image URL</Label>
        <Input
          id="p-image"
          value={form.imageUrl}
          onChange={(e) => set('imageUrl', e.target.value)}
          placeholder="https://…"
        />
        <p className="mt-1 text-xs text-ink-muted">
          Image management is URL-based — there is no file upload. Paste hosted image links below.
        </p>
      </div>

      <div className="mt-4">
        <Label>Gallery images</Label>
        <div className="space-y-2">
          {form.images.map((url, idx) => (
            <div key={idx} className="flex gap-2">
              <Input
                value={url}
                onChange={(e) => setImageAt(idx, e.target.value)}
                placeholder="https://…"
              />
              <Button variant="outline" size="sm" onClick={() => removeImage(idx)}>
                Remove
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addImage}>
            + Add image URL
          </Button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
        <Checkbox label="Active" checked={form.isActive} onChange={(v) => set('isActive', v)} />
        <Checkbox label="Featured" checked={form.isFeatured} onChange={(v) => set('isFeatured', v)} />
        <Checkbox
          label="Requires prescription"
          checked={form.requiresPrescription}
          onChange={(v) => set('requiresPrescription', v)}
        />
      </div>
    </Modal>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className={cn('inline-flex cursor-pointer items-center gap-2 text-sm text-ink-soft')}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-surface-border text-brand-600 focus:ring-brand/30"
      />
      {label}
    </label>
  );
}
