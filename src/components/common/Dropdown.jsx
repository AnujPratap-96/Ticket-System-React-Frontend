import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

/** Small accessible menu button: closes on outside click, Escape, or item click. */
export default function Dropdown({ label, icon: Icon, align = 'left', buttonClass = '', children }) {
  const [open, setOpen] = useState(false);
  const box = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const outside = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', outside);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', outside); document.removeEventListener('keydown', esc); };
  }, [open]);

  return (
    <div className="relative" ref={box}>
      <button type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} className={buttonClass}>
        {Icon && <Icon className="w-4 h-4" />}
        {label}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div role="menu" onClick={() => setOpen(false)} className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} mt-2 min-w-52 bg-white text-slate-800 border border-slate-200 rounded-xl shadow-xl py-1.5 z-50`}>
          {children}
        </div>
      )}
    </div>
  );
}

export const menuItem = 'flex items-center gap-2.5 w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50';
