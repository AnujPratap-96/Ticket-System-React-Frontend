// Mirrors the backend FSM so the UI only offers moves the API will accept.
const STAFF = {
  open: ['in_progress', 'closed'],
  in_progress: ['pending_customer', 'resolved', 'closed'],
  pending_customer: ['in_progress', 'resolved', 'closed'],
  resolved: ['in_progress', 'closed'],
  closed: [],
};
const CUSTOMER = {
  open: ['closed'],
  in_progress: ['closed'],
  pending_customer: ['in_progress', 'closed'],
  resolved: ['in_progress', 'closed'],
  closed: [],
};

export function allowedTransitions(role, status) {
  if (role === 'admin' && status === 'closed') return ['in_progress'];
  return (role === 'customer' ? CUSTOMER : STAFF)[status] || [];
}

export const STATUSES = ['open', 'in_progress', 'pending_customer', 'resolved', 'closed'];
export const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
export const label = (s) => s.replace('_', ' ').replace(/^\w/, (c) => c.toUpperCase());
export const fmt = (iso) => (iso ? new Date(iso).toLocaleString() : '—');
