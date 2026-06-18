'use client';

import { Modal } from '@/components/ui/Modal';
import { DataTable, type Column } from '@/components/ui/DataTable';
import {
  Button,
  Card,
  EmptyState,
  Input,
  Label,
  PageHeader,
} from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/cn';
import { useAdjustStock, useLowStock, useSetStock } from '@/lib/queries';
import type { Inventory } from '@/lib/types';
import { UserRole } from '@kawkaw/shared-types';
import { useState } from 'react';

export default function InventoryPage() {
  const { hasRole } = useAuth();
  const toast = useToast();
  const canManage = hasRole(UserRole.ADMIN, UserRole.SUPER_ADMIN);

  const { data, isLoading, isFetching, isError, error, refetch } = useLowStock();
  const adjust = useAdjustStock();
  const setStock = useSetStock();
  const [editing, setEditing] = useState<Inventory | null>(null);

  const doAdjust = (inv: Inventory, delta: number) => {
    adjust.mutate(
      { productId: inv.productId, delta },
      {
        onSuccess: () => toast.success(`Stock ${delta > 0 ? 'increased' : 'decreased'}`),
        onError: (e) => toast.error((e as Error).message),
      },
    );
  };

  const columns: Column<Inventory>[] = [
    {
      key: 'product',
      header: 'Product',
      render: (inv) => (
        <div>
          <p className="font-medium text-ink">{inv.product?.name ?? '—'}</p>
          <p className="text-xs text-ink-muted">{inv.product?.sku ?? inv.productId}</p>
        </div>
      ),
    },
    {
      key: 'quantity',
      header: 'In stock',
      align: 'right',
      render: (inv) => (
        <span
          className={cn(
            'font-medium',
            inv.quantity === 0 ? 'text-status-danger' : inv.quantity <= inv.lowStockThreshold ? 'text-amber-600' : 'text-ink',
          )}
        >
          {inv.quantity}
        </span>
      ),
    },
    {
      key: 'lowStockThreshold',
      header: 'Threshold',
      align: 'right',
      render: (inv) => <span className="text-ink-soft">{inv.lowStockThreshold}</span>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (inv) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!canManage || adjust.isPending}
            onClick={() => doAdjust(inv, 10)}
          >
            +10
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!canManage || adjust.isPending || inv.quantity <= 0}
            onClick={() => doAdjust(inv, -1)}
          >
            -1
          </Button>
          <Button variant="secondary" size="sm" disabled={!canManage} onClick={() => setEditing(inv)}>
            Set stock
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Inventory" subtitle="Low-stock alerts and stock adjustments" />
      <Card>
        {data && data.length === 0 ? (
          <EmptyState title="All stocked up" message="No products are below their low-stock threshold." />
        ) : (
          <DataTable
            columns={columns}
            rows={data}
            keyField={(inv) => inv.id}
            loading={isLoading || isFetching}
            error={isError ? (error as Error).message : null}
            onRetry={refetch}
            emptyTitle="All stocked up"
            emptyMessage="No products are below their low-stock threshold."
          />
        )}
      </Card>

      <SetStockModal
        key={editing?.id ?? 'none'}
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        inventory={editing}
        loading={setStock.isPending}
        onSubmit={(quantity, lowStockThreshold) => {
          if (!editing) return;
          setStock.mutate(
            { productId: editing.productId, quantity, lowStockThreshold },
            {
              onSuccess: () => {
                toast.success('Stock updated');
                setEditing(null);
              },
              onError: (e) => toast.error((e as Error).message),
            },
          );
        }}
      />
    </div>
  );
}

// --------------------------------------------------------------- set-stock modal

function SetStockModal({
  open,
  onClose,
  inventory,
  loading,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  inventory: Inventory | null;
  loading: boolean;
  onSubmit: (quantity: number, lowStockThreshold: number) => void;
}) {
  const toast = useToast();
  const [quantity, setQuantity] = useState(String(inventory?.quantity ?? ''));
  const [threshold, setThreshold] = useState(String(inventory?.lowStockThreshold ?? ''));

  const submit = () => {
    if (quantity.trim() === '' || Number.isNaN(Number(quantity))) {
      toast.error('Enter a valid quantity.');
      return;
    }
    onSubmit(Number(quantity), Number(threshold || 0));
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Set stock — ${inventory?.product?.name ?? ''}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={submit} loading={loading}>
            Save
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="s-qty">Quantity</Label>
          <Input
            id="s-qty"
            type="number"
            min="0"
            step="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0"
          />
        </div>
        <div>
          <Label htmlFor="s-threshold">Low-stock threshold</Label>
          <Input
            id="s-threshold"
            type="number"
            min="0"
            step="1"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            placeholder="0"
          />
        </div>
      </div>
    </Modal>
  );
}
