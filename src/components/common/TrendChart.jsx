/** Small dependency-free bar chart: created vs resolved per day. */
export default function TrendChart({ series }) {
  if (!series?.length) return null;
  const max = Math.max(1, ...series.flatMap((d) => [d.created, d.resolved]));
  const W = 720;
  const H = 160;
  const slot = W / series.length;
  const bar = Math.max(2, Math.min(14, slot / 2 - 2));

  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H + 20}`} className="w-full h-48" role="img" aria-label="Tickets created and resolved per day">
        <line x1="0" y1={H} x2={W} y2={H} stroke="#cbd5e1" />
        {series.map((d, i) => {
          const x = i * slot + slot / 2;
          const hc = (d.created / max) * (H - 8);
          const hr = (d.resolved / max) * (H - 8);
          return (
            <g key={d.date}>
              <title>{`${d.date}: ${d.created} created, ${d.resolved} resolved`}</title>
              <rect x={x - bar - 1} y={H - hc} width={bar} height={hc} fill="#6366f1" rx="1" />
              <rect x={x + 1} y={H - hr} width={bar} height={hr} fill="#10b981" rx="1" />
              {(i === 0 || i === series.length - 1 || i % Math.ceil(series.length / 6) === 0) && (
                <text x={x} y={H + 14} textAnchor="middle" fontSize="10" fill="#64748b">{d.date.slice(5)}</text>
              )}
            </g>
          );
        })}
      </svg>
      <figcaption className="flex gap-4 text-xs text-slate-600 mt-1">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-indigo-500" />Created</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-500" />Resolved</span>
      </figcaption>
    </figure>
  );
}
