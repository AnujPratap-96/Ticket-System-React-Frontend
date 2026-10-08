import { useEffect, useRef, useState } from 'react';
import api, { errorMessage } from '../../api/client';
import Modal from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import AttachmentPicker from '../../components/common/AttachmentPicker';
import { CustomFieldsInputs, cleanAnswers } from '../../components/ticket/CustomFields';
import { PRIORITIES, label } from '../../lib';

export default function NewTicketModal({ onClose, onCreated }) {
  const toast = useToast();
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({ department_id: '', title: '', description: '', priority: 'medium' });
  const [busy, setBusy] = useState(false);
  const [answers, setAnswers] = useState({});
  const [files, setFiles] = useState({ attachments: [], uploading: false });
  const picker = useRef(null);

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
      onCreated(res.data.ticket);
    } catch (err) {
      toast.error(errorMessage(err, 'Error creating ticket'));
    } finally {
      setBusy(false);
    }
  };

  const input = 'mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm';

  return (
    <Modal title="Submit New Ticket" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <label className="block text-sm font-medium text-slate-700">Department
          <select className={input} value={form.department_id} onChange={(e) => { setForm({ ...form, department_id: e.target.value }); setAnswers({}); }} required>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </label>
        <CustomFieldsInputs fields={departments.find((d) => String(d.id) === String(form.department_id))?.form_fields} values={answers} onChange={setAnswers} />
        <label className="block text-sm font-medium text-slate-700">Priority
          <select className={input} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            {PRIORITIES.map((p) => <option key={p} value={p}>{label(p)}</option>)}
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">Title
          <input className={input} required maxLength={255} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </label>
        <label className="block text-sm font-medium text-slate-700">Description
          <textarea className={input} rows={4} required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            onPaste={(e) => { const f = Array.from(e.clipboardData.files); if (f.length) { e.preventDefault(); picker.current?.addFiles(f); } }} />
        </label>
        <AttachmentPicker ref={picker} onChange={setFiles} disabled={busy} />
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-slate-300">Cancel</button>
          <button disabled={busy || files.uploading || !form.department_id} className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white font-semibold disabled:opacity-60">{busy ? 'Submitting…' : 'Submit'}</button>
        </div>
      </form>
    </Modal>
  );
}
