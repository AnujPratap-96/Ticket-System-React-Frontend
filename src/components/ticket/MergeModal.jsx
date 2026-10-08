import { useEffect, useState } from 'react';
import api, { errorMessage } from '../../api/client';
import Modal from '../common/Modal';
import { useToast } from '../../context/ToastContext';

/** Lead/admin: fold this (duplicate) ticket into another open ticket from the same customer. */
export default function MergeModal({ ticket, onClose, onMerged }) {
  const toast = useToast();
  const [options, setOptions] = useState([]);
  const [target, setTarget] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/tickets', { params: { customer_id: ticket.customer?.id, per_page: 50 } })
      .then((r) => setOptions((r.data.data || []).filter((t) => t.id !== ticket.id && t.status !== 'closed' && !t.merged_into)))
      .catch((e) => toast.error(errorMessage(e)));
  }, [ticket, toast]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api.post(`/tickets/${ticket.id}/merge`, { target_ticket_id: Number(target) });
      toast.success(res.data.message);
      onMerged(res.data.target_ticket_id);
    } catch (err) {
      toast.error(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <Modal title={`Merge ${ticket.ticket_number} into…`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <p className="text-sm text-slate-600">All messages from this ticket move to the one you pick, and this ticket is closed. This cannot be undone.</p>
        {options.length === 0 ? (
          <div className="text-sm text-slate-500 bg-slate-50 rounded-lg p-3">This customer has no other open tickets to merge into.</div>
        ) : (
          <select required value={target} onChange={(e) => setTarget(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
            <option value="" disabled>Select the ticket to keep…</option>
            {options.map((t) => <option key={t.id} value={t.id}>{t.ticket_number} — {t.title}</option>)}
          </select>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-slate-300">Cancel</button>
          <button disabled={!target || busy} className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white font-semibold disabled:opacity-50">{busy ? 'Merging…' : 'Merge tickets'}</button>
        </div>
      </form>
    </Modal>
  );
}
