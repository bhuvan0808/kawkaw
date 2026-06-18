'use client';

import { Badge, Button, Card, CardHeader, CenterSpinner, EmptyState, ErrorState, Input, Label, PageHeader, Textarea } from '@/components/ui/primitives';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/cn';
import { titleCase } from '@/lib/format';
import { useSettings, useUpsertSetting } from '@/lib/queries';
import type { Setting } from '@/lib/types';
import { useMemo, useState } from 'react';

/** Render an unknown setting value as a compact, readable string. */
function displayValue(value: unknown): string {
  if (value == null) return '—';
  if (typeof value === 'string') return value;
  if (typeof value === 'boolean' || typeof value === 'number') return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/** Editable string form of a value (objects pretty-printed). */
function toEditable(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

/** Parse a typed value as JSON, falling back to the raw string. */
function parseValue(raw: string): unknown {
  const t = raw.trim();
  if (t === '') return '';
  try {
    return JSON.parse(t);
  } catch {
    return raw;
  }
}

function isStoreOpenKey(key: string): boolean {
  return key.toLowerCase().replace(/[\s_-]/g, '') === 'storeopen';
}

interface EditState {
  key: string;
  value: string;
  description: string;
  isPublic: boolean;
  isNew: boolean;
}

export default function SettingsPage() {
  const toast = useToast();
  const { data, isLoading, isError, error, refetch } = useSettings();
  const upsert = useUpsertSetting();

  const [edit, setEdit] = useState<EditState | null>(null);

  const storeOpen = useMemo(() => data?.find((s) => isStoreOpenKey(s.key)) ?? null, [data]);

  const grouped = useMemo(() => {
    const map = new Map<string, Setting[]>();
    for (const s of data ?? []) {
      const cat = s.category || 'General';
      const arr = map.get(cat) ?? [];
      arr.push(s);
      map.set(cat, arr);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [data]);

  function openEdit(s: Setting) {
    setEdit({
      key: s.key,
      value: toEditable(s.value),
      description: s.description ?? '',
      isPublic: s.isPublic,
      isNew: false,
    });
  }

  function openCreate() {
    setEdit({ key: '', value: '', description: '', isPublic: false, isNew: true });
  }

  function toggleStoreOpen() {
    if (!storeOpen) return;
    const next = !(storeOpen.value === true);
    upsert.mutate(
      { key: storeOpen.key, value: next, description: storeOpen.description ?? undefined, category: storeOpen.category, isPublic: storeOpen.isPublic },
      {
        onSuccess: () => toast.success(next ? 'Store opened' : 'Store closed'),
        onError: (err) => toast.error((err as Error).message || 'Could not update store status.'),
      },
    );
  }

  function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!edit) return;
    if (!edit.key.trim()) {
      toast.error('Key is required.');
      return;
    }
    upsert.mutate(
      {
        key: edit.key.trim(),
        value: parseValue(edit.value),
        description: edit.description.trim() || undefined,
        isPublic: edit.isPublic,
      },
      {
        onSuccess: () => {
          toast.success('Setting saved');
          setEdit(null);
        },
        onError: (err) => toast.error((err as Error).message || 'Could not save setting.'),
      },
    );
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Platform configuration."
        action={<Button onClick={openCreate}>Add setting</Button>}
      />

      {isLoading ? (
        <CenterSpinner label="Loading settings…" />
      ) : isError ? (
        <ErrorState message={(error as Error).message} onRetry={() => refetch()} />
      ) : (data?.length ?? 0) === 0 ? (
        <Card>
          <EmptyState title="No settings yet" message="Add your first configuration value." />
        </Card>
      ) : (
        <div className="space-y-6">
          {storeOpen && (
            <Card className="flex items-center justify-between gap-4 p-5">
              <div>
                <p className="text-sm font-semibold text-ink">Store status</p>
                <p className="mt-0.5 text-xs text-ink-muted">
                  {storeOpen.description ?? 'Controls whether customers can place orders right now.'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={storeOpen.value === true ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                  {storeOpen.value === true ? 'Open' : 'Closed'}
                </Badge>
                <Button
                  variant={storeOpen.value === true ? 'danger' : 'primary'}
                  onClick={toggleStoreOpen}
                  loading={upsert.isPending}
                >
                  {storeOpen.value === true ? 'Close store' : 'Open store'}
                </Button>
              </div>
            </Card>
          )}

          {grouped.map(([category, settings]) => (
            <Card key={category}>
              <CardHeader title={titleCase(category)} subtitle={`${settings.length} setting${settings.length === 1 ? '' : 's'}`} />
              <div className="divide-y divide-surface-border">
                {settings.map((s) => (
                  <div key={s.key} className="flex items-start justify-between gap-4 px-5 py-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-sm font-medium text-ink">{s.key}</p>
                        {s.isPublic && <Badge className="bg-blue-100 text-blue-700">Public</Badge>}
                      </div>
                      {s.description && <p className="mt-0.5 text-xs text-ink-muted">{s.description}</p>}
                      <p className="mt-1 break-words font-mono text-xs text-ink-soft">{displayValue(s.value)}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => openEdit(s)}>
                      Edit
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(edit)}
        onClose={() => setEdit(null)}
        title={edit?.isNew ? 'Add setting' : `Edit ${edit?.key ?? 'setting'}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setEdit(null)} disabled={upsert.isPending}>
              Cancel
            </Button>
            <Button type="submit" form="setting-form" loading={upsert.isPending}>
              Save
            </Button>
          </>
        }
      >
        {edit && (
          <form id="setting-form" onSubmit={submitEdit} className="space-y-4">
            <div>
              <Label htmlFor="st-key">Key</Label>
              <Input
                id="st-key"
                value={edit.key}
                onChange={(e) => setEdit({ ...edit, key: e.target.value })}
                disabled={!edit.isNew}
                placeholder="e.g. DELIVERY_FEE"
                className={cn('font-mono', !edit.isNew && 'bg-surface-subtle')}
              />
            </div>
            <div>
              <Label htmlFor="st-value">Value</Label>
              <Textarea
                id="st-value"
                value={edit.value}
                onChange={(e) => setEdit({ ...edit, value: e.target.value })}
                placeholder='Plain text, or JSON e.g. true / 49 / {"key":"value"}'
                className="font-mono"
              />
              <p className="mt-1 text-xs text-ink-muted">Parsed as JSON when valid, otherwise stored as a string.</p>
            </div>
            <div>
              <Label htmlFor="st-desc">Description</Label>
              <Input id="st-desc" value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} placeholder="What this controls" />
            </div>
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input
                type="checkbox"
                checked={edit.isPublic}
                onChange={(e) => setEdit({ ...edit, isPublic: e.target.checked })}
                className="h-4 w-4 rounded border-surface-border text-brand-600 focus:ring-brand/40"
              />
              Public (exposed to client apps)
            </label>
          </form>
        )}
      </Modal>
    </div>
  );
}
