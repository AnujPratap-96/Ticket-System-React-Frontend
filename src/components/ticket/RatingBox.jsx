import { useState } from 'react';
import { Star } from 'lucide-react';
import api, { errorMessage } from '../../api/client';
import { useToast } from '../../context/ToastContext';

export default function RatingBox({ ticketId, existing, onRated }) {
  const toast = useToast();
  const [value, setValue] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  if (existing) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 text-sm text-slate-700">
        <div className="flex items-center gap-1" aria-label={`You rated ${existing.rating} out of 5`}>
          {[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`w-4 h-4 ${n <= existing.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />)}
          <span className="ml-2">Thanks for your feedback!</span>
        </div>
        {existing.comment && <p className="mt-1 text-slate-600">“{existing.comment}”</p>}
      </div>
    );
  }

  const submit = async () => {
    setBusy(true);
    try {
      await api.post(`/tickets/${ticketId}/rating`, { rating: value, comment: comment || null });
      toast.success('Thanks for your feedback!');
      onRated();
    } catch (err) {
      toast.error(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
      <div className="text-sm font-semibold text-slate-900">How was your support experience?</div>
      <div className="flex gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} star${n > 1 ? 's' : ''}`}
            onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => setValue(n)}>
            <Star className={`w-7 h-7 ${n <= (hover || value) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
          </button>
        ))}
      </div>
      <textarea aria-label="Comment" rows={2} maxLength={1000} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Anything we could do better? (optional)" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
      <button disabled={!value || busy} onClick={submit} className="bg-indigo-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold">{busy ? 'Sending…' : 'Submit rating'}</button>
    </div>
  );
}
