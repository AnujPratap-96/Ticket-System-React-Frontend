const input = 'mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white';

/** Renders a department's extra questions when filing a ticket. */
export function CustomFieldsInputs({ fields, values, onChange }) {
  if (!fields?.length) return null;
  const set = (k, v) => onChange({ ...values, [k]: v });
  return (
    <fieldset className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-slate-500">A few more details</legend>
      {fields.map((f) => (
        <label key={f.key} className={`block text-sm font-medium text-slate-700 ${f.type === 'checkbox' ? 'flex items-center gap-2' : ''}`}>
          {f.type === 'checkbox' ? <input type="checkbox" checked={!!values[f.key]} onChange={(e) => set(f.key, e.target.checked)} /> : null}
          <span>{f.label}{f.required && f.type !== 'checkbox' && <span className="text-rose-600"> *</span>}</span>
          {f.type === 'text' && <input required={f.required} maxLength={255} className={input} value={values[f.key] || ''} onChange={(e) => set(f.key, e.target.value)} />}
          {f.type === 'number' && <input required={f.required} type="number" className={input} value={values[f.key] ?? ''} onChange={(e) => set(f.key, e.target.value)} />}
          {f.type === 'textarea' && <textarea required={f.required} rows={3} maxLength={2000} className={input} value={values[f.key] || ''} onChange={(e) => set(f.key, e.target.value)} />}
          {f.type === 'select' && (
            <select required={f.required} className={input} value={values[f.key] || ''} onChange={(e) => set(f.key, e.target.value)}>
              <option value="">Choose…</option>{(f.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          )}
        </label>
      ))}
    </fieldset>
  );
}

/** Read-only answers on a ticket. */
export function CustomFieldsView({ items }) {
  if (!items?.length) return null;
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-sm">
      {items.map((i) => (
        <div key={i.label}><dt className="text-xs text-slate-500">{i.label}</dt><dd className="font-medium text-slate-900 break-words">{i.value}</dd></div>
      ))}
    </dl>
  );
}

/** Drop empty answers before sending. */
export const cleanAnswers = (values) => Object.fromEntries(Object.entries(values).filter(([, v]) => v !== '' && v != null));
