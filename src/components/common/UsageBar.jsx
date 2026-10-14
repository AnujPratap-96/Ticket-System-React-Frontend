/** "12 of 100": a thin bar that turns amber near the limit and red at it. limit = null means unlimited. */
export default function UsageBar({ label, used, limit, compact = false }) {
  const pct = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const tone = !limit ? 'bg-slate-300' : pct >= 100 ? 'bg-rose-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className={compact ? 'min-w-[8rem]' : ''}>
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="text-slate-600">{label}</span>
        <span className={`font-semibold ${limit && pct >= 100 ? 'text-rose-600' : 'text-slate-800'}`}>{used}{limit ? ` / ${limit}` : ' · no limit'}</span>
      </div>
      <div className="mt-1 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden" role="progressbar" aria-label={label} aria-valuenow={used} aria-valuemin={0} aria-valuemax={limit || undefined}>
        <div className={`h-full rounded-full ${tone}`} style={{ width: limit ? `${Math.max(pct, used > 0 ? 3 : 0)}%` : used > 0 ? '100%' : '0%', opacity: limit ? 1 : 0.5 }} />
      </div>
    </div>
  );
}
