import { useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
  UploadCloud, Star, Trash2, ArrowLeft, ArrowRight, Loader2, Link2, Settings2, AlertCircle, ImageIcon
} from 'lucide-react';
import { selectPermissions } from '../../store/authSlice';
import { isExecutive } from '../../utils/permissions';
import { uploadImages, deleteImage } from '../../api/client';
import MediaSettings from './MediaSettings';

const ACCEPT = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_MB = 5;
const fmtBytes = (b) => (b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.round(b / 1024) + ' KB');

// Gallery-style product image manager: drag-drop, multi-upload, preview,
// reorder, featured selection, delete. The product stores an array of URLs;
// the first URL is the main/featured image.
export default function ImageUploader({ images = [], onChange, productId }) {
  const exec = isExecutive(useSelector(selectPermissions));
  const list = (images || []).filter(Boolean);
  const inputRef = useRef(null);
  const metaRef = useRef({});            // url -> { w, h, bytes }
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showMedia, setShowMedia] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  const update = (next) => onChange?.(next.length ? next : []);

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    const bad = files.filter((f) => !ACCEPT.includes(f.type) || f.size > MAX_MB * 1024 * 1024);
    bad.forEach((f) =>
      toast.error(!ACCEPT.includes(f.type) ? `${f.name}: only JPG, PNG, WEBP` : `${f.name}: over ${MAX_MB} MB`)
    );
    const good = files.filter((f) => ACCEPT.includes(f.type) && f.size <= MAX_MB * 1024 * 1024);
    if (!good.length) return;

    setBusy(true); setProgress(0);
    try {
      const res = await uploadImages(good, { productId, onProgress: setProgress });
      const ok = (res.images || []).filter((i) => !i.error);
      ok.forEach((i) => { metaRef.current[i.url] = { w: i.width, h: i.height, bytes: i.bytes }; });
      (res.images || []).filter((i) => i.error).forEach((i) => toast.error(i.originalName + ': ' + i.error));
      if (ok.length) {
        update([...list, ...ok.map((i) => i.url)]);
        toast.success(ok.length + ' image(s) uploaded' + (res.requireApproval ? ' (pending approval)' : ''));
      }
    } catch (e) {
      toast.error(e.message.includes('401') || e.message.includes('Auth') ? 'Sign in to the backend to upload images' : e.message);
    } finally { setBusy(false); setProgress(0); }
  };

  const onDrop = (e) => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); };

  const setFeatured = (i) => { if (i === 0) return; const n = [...list]; const [x] = n.splice(i, 1); n.unshift(x); update(n); };
  const move = (i, d) => { const j = i + d; if (j < 0 || j >= list.length) return; const n = [...list]; [n[i], n[j]] = [n[j], n[i]]; update(n); };
  const remove = (i) => {
    const url = list[i];
    if (url && url.startsWith('/api/media/')) deleteImage(url).catch(() => {});
    update(list.filter((_, idx) => idx !== i));
  };
  const addUrl = () => {
    const u = urlInput.trim();
    if (!u) return;
    if (!/^https?:\/\//.test(u) && !u.startsWith('/api/media/')) return toast.error('Enter a valid image URL');
    update([...list, u]); setUrlInput('');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-semibold text-sm">Product images</div>
        {exec && (
          <button type="button" onClick={() => setShowMedia(true)} className="btn-ghost !p-1.5 text-xs" title="Media controls">
            <Settings2 size={14} /> Media
          </button>
        )}
      </div>

      <div className="rounded-xl bg-brand-50 dark:bg-brand-900/20 p-3 text-[11px] text-ink-600 dark:text-ink-300 leading-relaxed">
        <b>Guidelines:</b> JPG / PNG / WEBP only - max {MAX_MB} MB each, 25 MB total. Recommended:
        main 1200x1200, thumbnail 500x500, cover 1920x1080. Images are auto-compressed and converted to WEBP for fast loading.
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition ${drag ? 'border-brand-500 bg-brand-50/60' : 'border-ink-200 dark:border-white/15 hover:border-brand-400'}`}
      >
        <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp" multiple hidden
          onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }} />
        {busy ? (
          <div className="space-y-2">
            <Loader2 className="mx-auto animate-spin text-brand-600" />
            <div className="h-2 rounded-full bg-ink-100 overflow-hidden max-w-xs mx-auto">
              <div className="h-full bg-brand-500 transition-all" style={{ width: progress + '%' }} />
            </div>
            <div className="text-xs text-ink-500">Uploading... {progress}%</div>
          </div>
        ) : (
          <div className="text-sm text-ink-500">
            <UploadCloud className="mx-auto mb-1 text-brand-600" />
            <b className="text-ink-700 dark:text-ink-200">Drag &amp; drop images here</b> or click to browse
          </div>
        )}
      </div>

      {/* Gallery */}
      {list.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {list.map((url, i) => {
            const m = metaRef.current[url];
            return (
              <div key={url + i} className="relative group rounded-lg overflow-hidden ring-1 ring-ink-200 dark:ring-white/10 bg-ink-100">
                <img src={url} alt="" className="w-full h-24 object-cover" loading="lazy" />
                {i === 0 && <span className="absolute top-1 left-1 badge bg-brand-500 text-white text-[9px] px-1.5">Main</span>}
                {m && <span className="absolute bottom-1 left-1 right-1 text-[9px] bg-black/55 text-white rounded px-1 truncate">{m.w}x{m.h} - {fmtBytes(m.bytes)}</span>}
                <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1">
                  <button type="button" onClick={() => setFeatured(i)} title="Set as main" className="p-1.5 rounded bg-white/90 text-amber-600"><Star size={13} /></button>
                  <button type="button" onClick={() => move(i, -1)} title="Move left" className="p-1.5 rounded bg-white/90"><ArrowLeft size={13} /></button>
                  <button type="button" onClick={() => move(i, 1)} title="Move right" className="p-1.5 rounded bg-white/90"><ArrowRight size={13} /></button>
                  <button type="button" onClick={() => remove(i)} title="Delete" className="p-1.5 rounded bg-white/90 text-rose-600"><Trash2 size={13} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {list.length === 0 && (
        <div className="text-xs text-ink-500 flex items-center gap-1"><ImageIcon size={13} /> No images yet.</div>
      )}

      {/* Paste external URL fallback */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
          <input value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="...or paste an image URL" className="input pl-9 !py-2 !text-sm" />
        </div>
        <button type="button" onClick={addUrl} className="btn-outline !py-2 !px-3 text-sm">Add</button>
      </div>

      {!productId && (
        <p className="text-[11px] text-ink-400 flex items-center gap-1"><AlertCircle size={12} /> Save the product first to link uploads to it.</p>
      )}

      {showMedia && <MediaSettings onClose={() => setShowMedia(false)} />}
    </div>
  );
}
