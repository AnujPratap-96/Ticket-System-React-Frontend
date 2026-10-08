import { Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fmt } from '../../lib';

/** Customer satisfaction: daily average line, per-agent averages and the unhappy ratings to follow up. */
export default function SatisfactionPanel({ data }) {
  if (!data) return null;
  const pts = data.series.map((d, i) => ({ ...d, i }));
  const W = 720;
  const H = 120;
  const x = (i) => (pts.length === 1 ? W / 2 : (i / (pts.length - 1)) * W);
  const y = (v) => H - ((v - 1) / 4) * (H - 10);
  const line = pts.filter((p) => p.average != null).map((p, k) => `${k ? 'L' : 'M'}${x(p.i).toFixed(1)},${y(p.average).toFixed(1)}`).join(' ');

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-900 flex items-center gap-2"><Star className="w-4 h-4 text-amber-500" aria-hidden="true" />Customer satisfaction</h2>
        <span className="text-sm text-slate-600">{data.average != null ? <><strong className="text-slate-900">{data.average}</strong> / 5 from {data.count} {data.count === 1 ? 'rating' : 'ratings'}</> : 'No ratings in this period'}</span>
      </div>

      {data.count > 0 && (
        <svg viewBox={`0 0 ${W} ${H + 18}`} className="w-full h-32" role="img" aria-label="Average rating per day">
          {[1, 3, 5].map((v) => <g key={v}><line x1="0" x2={W} y1={y(v)} y2={y(v)} stroke="#e2e8f0" /><text x="2" y={y(v) - 3} fontSize="10" fill="#94a3b8">{v}</text></g>)}
          <path d={line} fill="none" stroke="#f59e0b" strokeWidth="2" />
          {pts.filter((p) => p.average != null).map((p) => (
            <circle key={p.date} cx={x(p.i)} cy={y(p.average)} r="3" fill="#f59e0b"><title>{`${p.date}: ${p.average} (${p.count})`}</title></circle>
          ))}
        </svg>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">By agent</h3>
          {data.by_agent.length === 0 ? <p className="text-sm text-slate-500">Nothing yet.</p> : (
            <ul className="space-y-1.5 text-sm">
              {data.by_agent.map((a) => <li key={a.agent_id} className="flex justify-between"><span>{a.agent}</span><span className="text-slate-600">★ {a.average} <span className="text-slate-400">({a.count})</span></span></li>)}
            </ul>
          )}
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Needs a follow-up (1–2 stars)</h3>
          {data.low_ratings.length === 0 ? <p className="text-sm text-slate-500">No unhappy customers in this period.</p> : (
            <ul className="space-y-2 text-sm">
              {data.low_ratings.map((r) => (
                <li key={r.ticket_id} className="rounded-lg border border-rose-100 bg-rose-50/60 px-3 py-2">
                  <Link to={`/staff/tickets/${r.ticket_id}`} className="font-medium text-rose-800 hover:underline">{r.ticket_number} · ★ {r.rating}</Link>
                  <div className="text-xs text-slate-600">{r.title}{r.agent ? ` · ${r.agent}` : ''} · {fmt(r.created_at)}</div>
                  {r.comment && <div className="text-xs text-slate-700 mt-0.5">“{r.comment}”</div>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
