import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Bold, Code, Italic, Link2, List, ListOrdered, Quote } from 'lucide-react';
import api from '../../api/client';

const TOOLS = [
  { key: 'bold', icon: Bold, label: 'Bold (Ctrl+B)', wrap: ['**', '**', 'bold text'] },
  { key: 'italic', icon: Italic, label: 'Italic (Ctrl+I)', wrap: ['*', '*', 'italic text'] },
  { key: 'link', icon: Link2, label: 'Link (Ctrl+K)', link: true },
  { key: 'ul', icon: List, label: 'Bullet list', prefix: '- ' },
  { key: 'ol', icon: ListOrdered, label: 'Numbered list', prefix: '1. ' },
  { key: 'quote', icon: Quote, label: 'Quote', prefix: '> ' },
  { key: 'code', icon: Code, label: 'Code', wrap: ['`', '`', 'code'] },
];

/**
 * A reply box with a formatting toolbar and a Preview tab. Text is stored as plain Markdown;
 * the preview is rendered by the server, so it is exactly what the recipient will see (and always safe).
 * `previewExtra` (e.g. the signature) is appended in the preview only.
 */
const RichEditor = forwardRef(function RichEditor({ value, onChange, placeholder, rows = 5, maxLength = 20000, previewExtra = '', onPaste, tone = 'default', ariaLabel = 'Message' }, ref) {
  const area = useRef(null);
  const [tab, setTab] = useState('write');
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(false);

  useImperativeHandle(ref, () => ({ focus: () => area.current?.focus() }));

  const edit = (fn) => {
    const el = area.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const { text, from, to } = fn(value, s, e);
    onChange(text);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(from, to); });
  };

  const apply = (t) => edit((v, s, e) => {
    const sel = v.slice(s, e);
    if (t.wrap) {
      const [a, b, ph] = t.wrap;
      const inner = sel || ph;
      return { text: v.slice(0, s) + a + inner + b + v.slice(e), from: s + a.length, to: s + a.length + inner.length };
    }
    if (t.link) {
      const label = sel || 'link text';
      const url = 'https://';
      const text = `${v.slice(0, s)}[${label}](${url})${v.slice(e)}`;
      const urlStart = s + label.length + 3;
      return { text, from: urlStart, to: urlStart + url.length };
    }
    // line prefixes: apply to every selected line
    const start = v.lastIndexOf('\n', s - 1) + 1;
    const endIdx = v.indexOf('\n', e) === -1 ? v.length : v.indexOf('\n', e);
    const block = v.slice(start, endIdx).split('\n').map((l, i) => (t.key === 'ol' ? `${i + 1}. ${l}` : t.prefix + l)).join('\n');
    return { text: v.slice(0, start) + block + v.slice(endIdx), from: start, to: start + block.length };
  });

  const onKey = (e) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    const map = { b: 'bold', i: 'italic', k: 'link' };
    const t = TOOLS.find((x) => x.key === map[e.key.toLowerCase()]);
    if (t) { e.preventDefault(); apply(t); }
  };

  useEffect(() => {
    if (tab !== 'preview') return undefined;
    const text = `${value}${previewExtra ? `\n\n${previewExtra}` : ''}`;
    if (!text.trim()) { setHtml(''); return undefined; }
    let live = true;
    setLoading(true);
    const id = setTimeout(() => {
      api.post('/rich-text/preview', { body: text }).then((r) => { if (live) setHtml(r.data.html); }).catch(() => { if (live) setHtml('<p>Preview is not available right now.</p>'); }).finally(() => live && setLoading(false));
    }, 150);
    return () => { live = false; clearTimeout(id); };
  }, [tab, value, previewExtra]);

  const border = tone === 'note' ? 'border-amber-300 bg-amber-50' : 'border-slate-300 bg-white';
  const tabBtn = (k, text) => (
    <button type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`px-3 py-1 rounded-md text-xs font-semibold ${tab === k ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{text}</button>
  );

  return (
    <div className={`rounded-lg border ${border}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-2 py-1.5">
        <div className="flex items-center gap-0.5" role="toolbar" aria-label="Formatting">
          {TOOLS.map((t) => (
            <button key={t.key} type="button" title={t.label} aria-label={t.label} disabled={tab !== 'write'} onClick={() => apply(t)} className="p-1.5 rounded text-slate-600 hover:bg-slate-100 disabled:opacity-30"><t.icon className="w-4 h-4" aria-hidden="true" /></button>
          ))}
        </div>
        <div className="flex gap-1" role="tablist" aria-label="Editor mode">{tabBtn('write', 'Write')}{tabBtn('preview', 'Preview')}</div>
      </div>
      {tab === 'write' ? (
        <textarea ref={area} aria-label={ariaLabel} rows={rows} maxLength={maxLength} value={value} onChange={(e) => onChange(e.target.value)} onKeyDown={onKey} onPaste={onPaste} placeholder={placeholder}
          className="w-full rounded-b-lg bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
      ) : (
        <div className="min-h-[7rem] px-3 py-2" aria-live="polite" aria-busy={loading}>
          {html ? <div className="rich text-sm text-slate-800" dangerouslySetInnerHTML={{ __html: html }} /> : <p className="text-sm text-slate-400">{loading ? 'Loading preview…' : 'Nothing to preview yet.'}</p>}
        </div>
      )}
      <div className="px-3 pb-1.5 text-[11px] text-slate-400">Formatting uses Markdown: **bold**, *italic*, - lists, [links](https://…)</div>
    </div>
  );
});

export default RichEditor;

/** A sent message, formatted. The HTML comes from the server's safe renderer. */
export function RichBody({ html, text }) {
  if (!html) return <p className="text-sm text-slate-800 whitespace-pre-wrap">{text}</p>;
  return <div className="rich text-sm text-slate-800" dangerouslySetInnerHTML={{ __html: html }} />;
}
