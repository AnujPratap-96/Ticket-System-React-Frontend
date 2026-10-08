import { AlertCircle } from 'lucide-react';

export default function CollisionBanner({ collisions }) {
  if (!collisions || collisions.length === 0) return null;
  const typing = collisions.filter((c) => c.action === 'typing');
  const names = (list) => list.map((c) => c.name).join(', ');

  return (
    <div role="alert" className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg mb-4 shadow-sm flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
      <div className="text-xs text-amber-900">
        <h4 className="text-sm font-semibold">Agent Collision Warning</h4>
        {typing.length > 0
          ? <p className="mt-0.5">{names(typing)} is currently replying to this ticket.</p>
          : <p className="mt-0.5">{names(collisions)} is also viewing this ticket.</p>}
      </div>
    </div>
  );
}
