import { useT } from '../../context/PreferencesContext';

const STATUS = {
  open: 'bg-blue-50 text-blue-700 border-blue-200',
  in_progress: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  pending_customer: 'bg-amber-50 text-amber-800 border-amber-200',
  resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  closed: 'bg-slate-100 text-slate-600 border-slate-300',
};
const PRIORITY = {
  low: 'bg-slate-100 text-slate-600 border-slate-200',
  medium: 'bg-sky-50 text-sky-700 border-sky-200',
  high: 'bg-orange-50 text-orange-700 border-orange-200',
  urgent: 'bg-rose-50 text-rose-700 border-rose-200',
};
const cls = 'px-2 py-0.5 rounded-full text-[11px] font-semibold border uppercase tracking-wide';
const pretty = (s) => s.replace('_', ' ');

export const StatusBadge = ({ status }) => { const t = useT(); return <span className={`${cls} ${STATUS[status]}`}>{t(`status.${status}`) === `status.${status}` ? pretty(status) : t(`status.${status}`)}</span>; };
export const PriorityBadge = ({ priority }) => { const t = useT(); return <span className={`${cls} ${PRIORITY[priority]}`}>{t(`priority.${priority}`)}</span>; };
