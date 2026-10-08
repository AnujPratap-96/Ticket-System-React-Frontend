import { useEffect, useState } from 'react';

const COLORS = ['bg-indigo-600', 'bg-emerald-600', 'bg-rose-600', 'bg-amber-600', 'bg-sky-600', 'bg-violet-600', 'bg-teal-600', 'bg-fuchsia-600'];

const colorFor = (name = '') => COLORS[[...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % COLORS.length];

/** Profile photo, or a coloured circle with the person's initial when there is none (or it fails to load). */
export default function Avatar({ user, size = 32, className = '' }) {
  const [broken, setBroken] = useState(false);
  const url = user?.avatar_url;
  useEffect(() => { setBroken(false); }, [url]);

  const name = user?.name || '?';
  const style = { width: size, height: size, fontSize: Math.max(11, Math.round(size * 0.42)) };

  if (url && !broken) {
    return <img src={url} alt="" width={size} height={size} loading="lazy" onError={() => setBroken(true)} style={style} className={`rounded-full object-cover shrink-0 bg-slate-200 ${className}`} />;
  }
  return (
    <span aria-hidden="true" style={style} className={`rounded-full shrink-0 inline-flex items-center justify-center font-bold uppercase text-white ${colorFor(name)} ${className}`}>
      {name.trim().slice(0, 1)}
    </span>
  );
}
