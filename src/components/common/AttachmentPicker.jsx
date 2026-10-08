import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { FileText, Paperclip, X } from 'lucide-react';
import { uploadFile, validateFile } from '../../lib/upload';

/**
 * Drag & drop / click / paste uploader. Reports the ready attachment references
 * and whether anything is still uploading via onChange({ attachments, uploading }).
 * Parent can call ref.addFiles(fileList) (used for pasting screenshots).
 */
const AttachmentPicker = forwardRef(function AttachmentPicker({ ticketId = null, onChange, disabled = false, maxFiles = 5 }, ref) {
  const [items, setItems] = useState([]);
  const [dragging, setDragging] = useState(false);
  const input = useRef(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => {
    onChange({
      attachments: items.filter((i) => i.status === 'done').map((i) => i.result),
      uploading: items.some((i) => i.status === 'uploading'),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  // Free object URLs when the component unmounts.
  useEffect(() => () => itemsRef.current.forEach((i) => i.preview && URL.revokeObjectURL(i.preview)), []);

  const patch = (id, change) => setItems((list) => list.map((i) => (i.id === id ? { ...i, ...change } : i)));

  const addFiles = useCallback((fileList) => {
    const files = Array.from(fileList || []);
    const room = maxFiles - itemsRef.current.length;
    files.slice(0, Math.max(0, room)).forEach((file) => {
      const id = crypto.randomUUID();
      const problem = validateFile(file);
      const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
      setItems((list) => [...list, { id, name: file.name, size: file.size, preview, progress: 0, status: problem ? 'error' : 'uploading', error: problem }]);
      if (problem) return;
      uploadFile(file, ticketId, (progress) => patch(id, { progress }))
        .then((result) => patch(id, { status: 'done', progress: 100, result }))
        .catch((err) => patch(id, { status: 'error', error: err.message }));
    });
    if (files.length > room) {
      setItems((list) => [...list, { id: crypto.randomUUID(), name: `Only ${maxFiles} files per message`, status: 'error', error: 'Limit reached' }]);
    }
  }, [ticketId, maxFiles]);

  useImperativeHandle(ref, () => ({
    addFiles,
    reset: () => {
      itemsRef.current.forEach((i) => i.preview && URL.revokeObjectURL(i.preview));
      setItems([]);
    },
  }), [addFiles]);

  const remove = (id) => setItems((list) => {
    const gone = list.find((i) => i.id === id);
    if (gone?.preview) URL.revokeObjectURL(gone.preview);
    return list.filter((i) => i.id !== id);
  });

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); if (!disabled) addFiles(e.dataTransfer.files); }}
        className={`border border-dashed rounded-lg px-3 py-2 text-xs flex items-center gap-2 ${dragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 text-slate-500'}`}
      >
        <Paperclip className="w-4 h-4" />
        <span>
          Drag files here, paste a screenshot, or{' '}
          <button type="button" disabled={disabled} onClick={() => input.current?.click()} className="text-indigo-600 font-semibold underline">browse</button>
          <span className="text-slate-400"> · images, PDF, txt, log, zip · max 10 MB</span>
        </span>
        <input ref={input} type="file" multiple hidden accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.txt,.log,.zip"
          onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
      </div>

      {items.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-2">
          {items.map((i) => (
            <li key={i.id} className={`relative w-28 border rounded-lg p-1.5 text-[11px] ${i.status === 'error' ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-white'}`}>
              {i.preview
                ? <img src={i.preview} alt="" className="w-full h-16 object-cover rounded" />
                : <div className="w-full h-16 flex items-center justify-center bg-slate-100 rounded"><FileText className="w-6 h-6 text-slate-400" /></div>}
              <div className="mt-1 truncate" title={i.name}>{i.name}</div>
              {i.status === 'uploading' && (
                <div className="h-1 bg-slate-200 rounded mt-1" role="progressbar" aria-valuenow={i.progress}><div className="h-1 bg-indigo-600 rounded" style={{ width: `${i.progress}%` }} /></div>
              )}
              {i.status === 'error' && <div className="text-rose-700 mt-0.5">{i.error}</div>}
              <button type="button" onClick={() => remove(i.id)} aria-label={`Remove ${i.name}`} className="absolute -top-1.5 -right-1.5 bg-slate-700 text-white rounded-full p-0.5"><X className="w-3 h-3" /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});

export default AttachmentPicker;
