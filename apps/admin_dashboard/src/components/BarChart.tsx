'use client';

import { cn } from '@/lib/cn';

export interface BarDatum {
  label: string;
  value: number;
  sub?: string;
}

/** Lightweight dependency-free vertical bar chart for trend panels. */
export function BarChart({ data, format, className }: { data: BarDatum[]; format?: (v: number) => string; className?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className={cn('flex items-end gap-2', className)}>
      {data.map((d, i) => (
        <div key={i} className="group flex flex-1 flex-col items-center gap-2">
          <div className="relative flex h-32 w-full items-end justify-center">
            <div
              className="w-full max-w-[36px] rounded-t-md bg-brand-500/80 transition-all group-hover:bg-brand-600"
              style={{ height: `${Math.max(4, (d.value / max) * 100)}%` }}
              title={format ? format(d.value) : String(d.value)}
            />
          </div>
          <div className="text-center">
            <p className="text-[11px] font-medium text-ink">{format ? format(d.value) : d.value}</p>
            <p className="text-[10px] text-ink-muted">{d.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Horizontal progress-style bars for ranked breakdowns. */
export function RankBars({ data, format }: { data: BarDatum[]; format?: (v: number) => string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <div key={i}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-medium text-ink-soft">{d.label}</span>
            <span className="text-ink-muted">{format ? format(d.value) : d.value}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-subtle">
            <div className="h-full rounded-full bg-brand-500" style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
