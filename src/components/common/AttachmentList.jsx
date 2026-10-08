import { Download, FileText } from 'lucide-react';

const size = (b) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

/** Renders stored attachments (each carries a fresh expiring download URL from the API). */
export default function AttachmentList({ attachments }) {
  if (!attachments || attachments.length === 0) return null;
  return (
    <ul className="mt-3 flex flex-wrap gap-2">
      {attachments.map((a) => (
        <li key={a.public_id || a.name}>
          <a href={a.url} target="_blank" rel="noopener noreferrer" download={a.name}
            className="flex items-center gap-2 border border-slate-200 bg-white rounded-lg p-1.5 pr-3 text-xs text-slate-700 hover:border-indigo-300">
            {a.is_image
              ? <img src={a.url} alt={a.name} loading="lazy" className="w-12 h-12 object-cover rounded" />
              : <span className="w-12 h-12 flex items-center justify-center bg-slate-100 rounded"><FileText className="w-5 h-5 text-slate-400" /></span>}
            <span className="max-w-[10rem]"><span className="block truncate font-medium">{a.name}</span><span className="text-slate-400">{size(a.bytes || 0)}</span></span>
            <Download className="w-3.5 h-3.5 text-slate-400" />
          </a>
        </li>
      ))}
    </ul>
  );
}
