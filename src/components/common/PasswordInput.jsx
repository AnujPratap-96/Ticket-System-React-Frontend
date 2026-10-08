import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/**
 * Drop-in replacement for <input type="password"> with a show/hide button.
 * Any `mt-*` class is moved to the wrapper so the button stays aligned with the field.
 */
export default function PasswordInput({ className = '', ...props }) {
  const [visible, setVisible] = useState(false);
  const margin = className.match(/\bmt-\d+\b/)?.[0] || '';
  const inputClass = className.replace(/\bmt-\d+\b/, '').trim();

  return (
    <div className={`relative ${margin}`}>
      <input {...props} type={visible ? 'text' : 'password'} className={`${inputClass} pr-11`} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        title={visible ? 'Hide password' : 'Show password'}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:text-indigo-600"
      >
        {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}
