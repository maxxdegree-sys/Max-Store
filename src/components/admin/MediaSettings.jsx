import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { X, HardDrive, ShieldCheck, Image as ImageIcon, Check, Ban } from 'lucide-react';
import { api } from '../../api/client';

const fmtBytes = (b) => (b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.round((b || 0) / 1024) + ' KB');

// Executive-only: storage usage, pending-image approvals, and upload limits.
export default function MediaSettings({ onClose }) {
  const [tab, setTab] = useState('usage');
  const [usage, setUsage] = useState(null);
  const [pending, setPending] = useState([]);
  const [settings, setSettings] = useState({ maxFileMB: 5, maxTotalMB: 25, requireApproval: false, watermark: false });
  const [loading, setLoading] = useState(true);

  const loadUsage = () =>
    api('/uploads/usage').then((d) => { setUsage(d); setSettings(d.settings || settings); }).catch((e) => toast.error(e.message));
  const loadPending = () => api('/uploads/library?status=pending').then((d) => setPending(d.images || [])).catch((e) => toast.error(e.message));

  useEffect(() => { Promise.all([loadUsage(), loadPending()]).finally(() => setLoading(false)); }, []);

  const moderate = async (id, status) => {
    try { await api('/uploads/' + id + '/status', { method: 'PATCH', body: { status } }); setPending((p) => p.filter((x) => x.id !== id)); toast.success('Image ' + status); }
    catch (e) { toast.error(e.message); }
  };
  const saveSettings = async () => {
    try { await api('/uploads/settings', { method: 'PUT', body: settings }); toast.success('Upload settings saved'); }
    catch (e) { toast.error(e.message); }
  };
  const set = (k, v) => setSettings((s) => ({ ...s, [k]: v }));

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-ink-900 shadow-2xl overflow-y-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg flex items-center gap-2"><HardDrive size={18} /> Media Controls</h3>
          <button onClick={onClose} className="btn-ghost !p-2"><X /></button>
        </div>

        <div className="flex gap-1 p-1 rounded-xl bg-ink-100 dark:bg-white/5 text-sm">
          {['usage', 'approvals', 'settings'].map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`flex-1 py-1.5 rounded-lg font-medium capitalize ${tab === t ? 'bg-white dark:bg-ink-800 shadow' : ''}`}>{t}</button>
          ))}
        </div>

        {loading && <p className="text-sm text-ink-500">Loading...</p>}

        {!loading && tab === 'usage' && usage && (
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Storage used" value={fmtBytes(usage.bytes)} />
            <Stat label="Files stored" value={usage.files} />
            <Stat label="Pending review" value={usage.pending} />
            <Stat label="Watermark" value={settings.watermark ? 'On' : 'Off'} />
          </div>
        )}

        {!loading && tab === 'approvals' && (
          <div className="space-y-2">
            {pending.length === 0 && <p className="text-sm text-ink-500 flex items-center gap-1"><ImageIcon size={14} /> No images awaiting approval.</p>}
            {pending.map((m) => (
              <div key={m.id} className="flex items-center gap-3 rounded-lg ring-1 ring-ink-200 dark:ring-white/10 p-2">
                <img src={m.thumbUrl || m.url} alt="" className="w-12 h-12 rounded object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{m.originalName || m.id}</div>
                  <div className="text-[11px] text-ink-500">by {m.uploaderName}</div>
                </div>
                <button onClick={() => moderate(m.id, 'approved')} className="p-2 rounded bg-brand-50 text-brand-700" title="Approve"><Check size={15} /></button>
                <button onClick={() => moderate(m.id, 'rejected')} className="p-2 rounded bg-rose-50 text-rose-600" title="Reject"><Ban size={15} /></button>
              </div>
            ))}
          </div>
        )}

        {!loading && tab === 'settings' && (
          <div className="space-y-4">
            <label className="text-sm block"><div className="font-semibold mb-1">Max size per image (MB)</div>
              <input type="number" className="input" value={settings.maxFileMB} onChange={(e) => set('maxFileMB', +e.target.value)} />
            </label>
            <label className="text-sm block"><div className="font-semibold mb-1">Max total per product (MB)</div>
              <input type="number" className="input" value={settings.maxTotalMB} onChange={(e) => set('maxTotalMB', +e.target.value)} />
            </label>
            <Toggle label="Require approval before images go live" checked={settings.requireApproval} onChange={(v) => set('requireApproval', v)} />
            <Toggle label="Add 'Maxx' watermark to uploads" checked={settings.watermark} onChange={(v) => set('watermark', v)} />
            <button onClick={saveSettings} className="btn-primary w-full"><ShieldCheck size={16} /> Save settings</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="card p-4">
      <div className="text-xs uppercase tracking-wider text-ink-500 font-bold">{label}</div>
      <div className="text-xl font-extrabold mt-1">{value}</div>
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="w-full flex items-center justify-between rounded-xl px-4 py-3 ring-1 ring-ink-200 dark:ring-white/10">
      <span className="text-sm font-medium text-left pr-3">{label}</span>
      <span className={`w-10 h-6 rounded-full relative transition shrink-0 ${checked ? 'bg-brand-500' : 'bg-ink-300'}`}>
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition ${checked ? 'left-[18px]' : 'left-0.5'}`} />
      </span>
    </button>
  );
}
