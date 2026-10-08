import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api, { errorMessage } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import ArticleSuggestions from '../../components/ticket/ArticleSuggestions';
import AttachmentPicker from '../../components/common/AttachmentPicker';
import { CustomFieldsInputs, cleanAnswers } from '../../components/ticket/CustomFields';
import { PRIORITIES } from '../../lib';
import { useT } from '../../context/PreferencesContext';

const input = 'mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white';

export default function PortalNewTicketPage() {
  const toast = useToast();
  const t = useT();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({ department_id: '', title: params.get('title') || '', description: '', priority: 'medium' });
  const [busy, setBusy] = useState(false);
  const [answers, setAnswers] = useState({});
  const [files, setFiles] = useState({ attachments: [], uploading: false });
  const picker = useRef(null);
  const [open, setOpen] = useState([]);

  // "You already have an open ticket about this": saves a duplicate and keeps the history in one place.
  useEffect(() => {
    if (form.title.trim().length < 6) { setOpen([]); return undefined; }
    const t = setTimeout(() => { api.get('/tickets-similar', { params: { title: form.title } }).then((r) => setOpen(r.data.tickets)).catch(() => setOpen([])); }, 500);
    return () => clearTimeout(t);
  }, [form.title]);

  useEffect(() => {
    api.get('/departments')
      .then((res) => {
        const list = res.data.departments || [];
        setDepartments(list);
        if (list[0]) setForm((f) => ({ ...f, department_id: list[0].id }));
      })
      .catch((err) => toast.error(errorMessage(err, 'Could not load departments')));
  }, [toast]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api.post('/tickets', { ...form, attachments: files.attachments, custom_fields: cleanAnswers(answers) });
      toast.success(`Ticket ${res.data.ticket.ticket_number} created`);
      navigate(`/portal/tickets/${res.data.ticket.id}`);
    } catch (err) {
      toast.error(errorMessage(err, 'Could not create ticket'));
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{t('new.title')}</h1>
        <p className="text-sm text-slate-500">{t('new.intro')}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block text-sm font-medium text-slate-700">{t('new.department')}
          <select required className={input} value={form.department_id} onChange={(e) => { setForm({ ...form, department_id: e.target.value }); setAnswers({}); }}>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">{t('new.urgency')}
          <select className={input} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            {PRIORITIES.map((p) => <option key={p} value={p}>{t(`priority.${p}`)}</option>)}
          </select>
        </label>
      </div>
      <CustomFieldsInputs fields={departments.find((d) => String(d.id) === String(form.department_id))?.form_fields} values={answers} onChange={setAnswers} />
      <label className="block text-sm font-medium text-slate-700">{t('new.subject')}
        <input required maxLength={255} className={input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </label>
      {open.length > 0 && (
        <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          You already have an open ticket that looks similar:
          <ul className="mt-1 space-y-0.5">{open.map((t) => <li key={t.id}><Link to={`/portal/tickets/${t.id}`} className="font-semibold underline">{t.ticket_number}</Link> {t.title}</li>)}</ul>
          <span className="text-xs">You can add a reply there instead of opening a new one.</span>
        </div>
      )}
      <ArticleSuggestions query={form.title} />
      <label className="block text-sm font-medium text-slate-700">{t('new.message')}
        <textarea required rows={7} className={input} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
          onPaste={(e) => { const f = Array.from(e.clipboardData.files); if (f.length) { e.preventDefault(); picker.current?.addFiles(f); } }} />
      </label>
      <div>
        <div className="text-sm font-medium text-slate-700 mb-1">{t('new.attachments')}</div>
        <AttachmentPicker ref={picker} onChange={setFiles} disabled={busy} />
      </div>
      <div className="flex justify-end">
        <button disabled={busy || files.uploading || !form.department_id} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-5 py-2 rounded-lg text-sm font-semibold">{busy ? t('new.submitting') : t('new.submit')}</button>
      </div>
    </form>
  );
}
