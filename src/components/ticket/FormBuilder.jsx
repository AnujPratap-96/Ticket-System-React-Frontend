import { Plus, Trash2 } from 'lucide-react';

const TYPES = [['text', 'Short text'], ['textarea', 'Long text'], ['number', 'Number'], ['select', 'Dropdown'], ['checkbox', 'Yes / no']];
const f = 'border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm bg-white';
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').replace(/^(\d)/, 'f_$1').slice(0, 40);

/** Admin editor for the questions a department asks when a ticket is filed. */
export default function FormBuilder({ fields, onChange }) {
  const update = (i, patch) => onChange(fields.map((x, k) => (k === i ? { ...x, ...patch } : x)));
  const add = () => onChange([...fields, { key: `field_${fields.length + 1}`, label: '', type: 'text', required: false, options: [] }]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">Ticket form questions</h3>
        {fields.length < 8 && <button type="button" onClick={add} className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600"><Plus className="w-3.5 h-3.5" />Add question</button>}
      </div>
      {fields.length === 0 && <p className="text-xs text-slate-500">No extra questions. Customers only see subject and message.</p>}
      {fields.map((x, i) => (
        <div key={i} className="grid grid-cols-12 gap-2 items-start rounded-lg border border-slate-200 p-2">
          <input aria-label="Question" placeholder="Question, e.g. Server name" required className={`${f} col-span-12 sm:col-span-5`} value={x.label}
            onChange={(e) => update(i, { label: e.target.value, key: slug(e.target.value) || x.key })} />
          <select aria-label="Answer type" className={`${f} col-span-6 sm:col-span-3`} value={x.type} onChange={(e) => update(i, { type: e.target.value })}>
            {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <label className="col-span-4 sm:col-span-3 flex items-center gap-1.5 text-xs text-slate-600 py-2"><input type="checkbox" checked={!!x.required} onChange={(e) => update(i, { required: e.target.checked })} />Required</label>
          <button type="button" aria-label="Remove question" onClick={() => onChange(fields.filter((_, k) => k !== i))} className="col-span-2 sm:col-span-1 text-slate-400 hover:text-rose-600 py-2"><Trash2 className="w-4 h-4" /></button>
          {x.type === 'select' && (
            <input aria-label="Options" required placeholder="Options, comma separated" className={`${f} col-span-12`} value={(x.options || []).join(', ')}
              onChange={(e) => update(i, { options: e.target.value.split(',').map((o) => o.trim()).filter(Boolean) })} />
          )}
        </div>
      ))}
    </div>
  );
}
