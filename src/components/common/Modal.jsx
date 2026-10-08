import { useEffect, useRef } from 'react';

export default function Modal({ title, onClose, children }) {
  const ref = useRef(null);

  useEffect(() => {
    const previous = document.activeElement;
    ref.current?.querySelector('input, select, textarea, button')?.focus();

    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') {
        const items = ref.current.querySelectorAll('button, input, select, textarea, [href]');
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-40 flex items-center justify-center p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={title} className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">{title}</h2>
        {children}
      </div>
    </div>
  );
}
