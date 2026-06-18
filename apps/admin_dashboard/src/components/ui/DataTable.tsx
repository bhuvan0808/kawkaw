'use client';

import { cn } from '@/lib/cn';
import { useEffect, useState, type ReactNode } from 'react';
import { Button, CenterSpinner, EmptyState, ErrorState, Input } from './primitives';

export interface Column<T> {
  key: string;
  header: ReactNode;
  render?: (row: T) => ReactNode;
  className?: string;
  align?: 'left' | 'right' | 'center';
}

export function DataTable<T>({
  columns,
  rows,
  keyField,
  loading,
  error,
  onRetry,
  onRowClick,
  emptyTitle = 'Nothing here yet',
  emptyMessage,
}: {
  columns: Column<T>[];
  rows: T[] | undefined;
  keyField: (row: T) => string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onRowClick?: (row: T) => void;
  emptyTitle?: string;
  emptyMessage?: string;
}) {
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (loading && !rows) return <CenterSpinner label="Loading…" />;
  if (rows && rows.length === 0) return <EmptyState title={emptyTitle} message={emptyMessage} />;

  return (
    <div className="scrollbar-thin w-full overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-surface-border text-left text-xs font-medium uppercase tracking-wide text-ink-muted">
            {columns.map((c) => (
              <th
                key={c.key}
                className={cn('whitespace-nowrap px-4 py-3', c.align === 'right' && 'text-right', c.align === 'center' && 'text-center', c.className)}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={cn(loading && 'opacity-60')}>
          {rows?.map((row) => (
            <tr
              key={keyField(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                'border-b border-surface-border/70 last:border-0',
                onRowClick && 'cursor-pointer hover:bg-surface-subtle',
              )}
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={cn('px-4 py-3 align-middle text-ink-soft', c.align === 'right' && 'text-right', c.align === 'center' && 'text-center', c.className)}
                >
                  {c.render ? c.render(row) : (row as Record<string, ReactNode>)[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  total,
  onPage,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPage: (p: number) => void;
}) {
  if (total === 0) return null;
  return (
    <div className="flex items-center justify-between gap-3 border-t border-surface-border px-4 py-3 text-sm text-ink-muted">
      <span>
        Page <span className="font-medium text-ink">{page}</span> of {Math.max(totalPages, 1)} · {total} total
      </span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </Button>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}

/** Debounced search box that reports the committed term upward. */
export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [local, setLocal] = useState(value);
  useEffect(() => setLocal(value), [value]);
  useEffect(() => {
    const t = setTimeout(() => {
      if (local !== value) onChange(local);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local]);
  return (
    <Input
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      placeholder={placeholder}
      className="sm:w-64"
      type="search"
    />
  );
}

export function Toolbar({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-3 border-b border-surface-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">{children}</div>;
}
