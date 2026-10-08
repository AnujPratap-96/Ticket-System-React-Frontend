import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const STYLES = {
  success: { icon: CheckCircle2, accent: 'bg-emerald-500', iconColor: 'text-emerald-600', title: 'Done' },
  error: { icon: AlertCircle, accent: 'bg-rose-500', iconColor: 'text-rose-600', title: 'Something went wrong' },
  info: { icon: Info, accent: 'bg-indigo-500', iconColor: 'text-indigo-600', title: 'Heads up' },
};
const DURATION = { success: 4000, info: 4500, error: 7000 };
const MAX_VISIBLE = 4;

function Toast({ toast, onClose }) {
  const { icon: Icon, accent, iconColor } = STYLES[toast.type];
  const timer = useRef(null);
  const [paused, setPaused] = useState(false);

  // The timer is armed by the progress bar's animationend: hovering pauses the bar, and so the dismissal.
  return (
    <div
      data-toast
      role={toast.type === 'error' ? 'alert' : 'status'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{ animation: 'toast-in 0.22s ease-out' }}
      className="relative overflow-hidden pointer-events-auto w-full sm:w-[360px] bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-900/10"
    >
      <span className={`absolute inset-y-0 left-0 w-1 ${accent}`} aria-hidden="true" />
      <div className="flex items-start gap-3 pl-4 pr-2 py-3">
        <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${iconColor}`} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-slate-900">{toast.title}</div>
          <div className="text-sm text-slate-600 break-words">{toast.message}</div>
        </div>
        <button onClick={onClose} aria-label="Dismiss notification" className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 shrink-0"><X className="w-4 h-4" /></button>
      </div>
      <div className="h-0.5 bg-slate-100" aria-hidden="true">
        <div
          data-toast-bar
          ref={timer}
          onAnimationEnd={onClose}
          style={{ animation: `toast-progress ${DURATION[toast.type]}ms linear forwards`, animationPlayState: paused ? 'paused' : 'running', transformOrigin: 'left' }}
          className={`h-full ${accent}`}
        />
      </div>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const close = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const push = useCallback((message, type, title) => {
    const id = crypto.randomUUID();
    setToasts((t) => [...t.slice(-(MAX_VISIBLE - 1)), { id, message, type, title: title || STYLES[type].title }]);
  }, []);

  const value = useMemo(() => ({
    info: (m, title) => push(m, 'info', title),
    success: (m, title) => push(m, 'success', title),
    error: (m, title) => push(m, 'error', title),
  }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Top-right so it never hides behind the assistant bubble (bottom-right) */}
      <div className="fixed top-16 right-4 left-4 sm:left-auto z-[70] flex flex-col items-end gap-2 pointer-events-none" aria-live="polite">
        {toasts.map((t) => <Toast key={t.id} toast={t} onClose={() => close(t.id)} />)}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
