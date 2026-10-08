import { Clock, CheckCircle2, PauseCircle, XCircle } from 'lucide-react';
import useSlaTimer from '../../hooks/useSlaTimer';

export default function SlaBadge({ deadline }) {
  const live = useSlaTimer(deadline?.target_deadline, !!deadline && !deadline.is_fulfilled && !deadline.is_paused);
  if (!deadline) return null;

  const { metric_type, is_fulfilled, is_breached, is_paused } = deadline;
  const label = metric_type === 'first_response' ? 'First Response' : 'Resolution';
  const base = 'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border';

  if (is_fulfilled && !is_breached) {
    return <div className={`${base} bg-emerald-50 text-emerald-700 border-emerald-200`}><CheckCircle2 className="w-3.5 h-3.5" /><span>{label}: Met</span></div>;
  }
  if (is_fulfilled && is_breached) {
    return <div className={`${base} bg-rose-50 text-rose-700 border-rose-200`}><XCircle className="w-3.5 h-3.5" /><span>{label}: Met late</span></div>;
  }
  if (is_paused) {
    return <div className={`${base} bg-slate-100 text-slate-700 border-slate-300`}><PauseCircle className="w-3.5 h-3.5" /><span>{label}: Paused (waiting on customer)</span></div>;
  }
  if (is_breached || (live !== null && live < 0)) {
    return <div className={`${base} bg-rose-50 text-rose-700 border-rose-200 font-semibold`}><XCircle className="w-3.5 h-3.5" /><span>{label}: Breached</span></div>;
  }

  const hours = Math.floor(live / 60);
  const mins = live % 60;
  const urgent = live <= 60;
  return (
    <div className={`${base} ${urgent ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>
      <Clock className="w-3.5 h-3.5" />
      <span>{label}: {hours}h {mins}m left</span>
    </div>
  );
}
