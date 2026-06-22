import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { X, Settings2, ListChecks, Power } from 'lucide-react';
import { api } from '../../api/client';

// Executive-only panel: enable/disable smart import globally, grant access to
// specific team members, and review the import activity log.
export default function ImportSettings({ onClose }) {
  const [tab, setTab] = useState('settings');
  const [enabled, setEnabled] = useState(true);
  const [allowed, setAllowed] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/import/settings')
      .then((d) => { setEnabled(d.import.enabled); setAllowed(d.import.allowedUserIds || []); setAdmins(d.admins || []); })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  const loadLog = () => api('/import/log').then((d) => setLog(d.log || [])).catch((e) => toast.error(e.message));

  const toggleUser = (id) =>
    setAllowed((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));

  const save = async () => {
    try {
      await api('/import/settings', { method: 'PUT', body: { enabled, allowedUserIds: allowed } });
      toast.success('Import settings saved');
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-ink-900 shadow-2xl overflow-y-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg flex items-center gap-2"><Settings2 size={18} /> Smart Import Controls</h3>
          <button onClick={onClose} className="btn-ghost !p-2"><X /></button>
        </div>

        <div className="flex gap-1 p-1 rounded-xl bg-ink-100 dark:bg-white/5 text-sm">
          <button onClick={() => setTab('settings')} className={`flex-1 py-1.5 rounded-lg font-medium ${tab === 'settings' ? 'bg-white dark:bg-ink-800 shadow' : ''}`}>Access</button>
          <button onClick={() => { setTab('log'); loadLog(); }} className={`flex-1 py-1.5 rounded-lg font-medium ${tab === 'log' ? 'bg-white dark:bg-ink-800 shadow' : ''}`}>Activity Log</button>
        </div>

        {loading && <p className="text-sm text-ink-500">Loading...</p>}

        {!loading && tab === 'settings' && (
          <div className="space-y-4">
            <button onClick={() => setEnabled((v) => !v)} className={`w-full flex items-center justify-between rounded-xl px-4 py-3 ring-1 ${enabled ? 'bg-brand-50 ring-brand-200 text-brand-800' : 'bg-ink-100 ring-ink-200 text-ink-600'}`}>
              <span className="flex items-center gap-2 font-semibold"><Power size={16} /> Feature {enabled ? 'enabled' : 'disabled'}</span>
              <span className={`w-10 h-6 rounded-full relative transition ${enabled ? 'bg-brand-500' : 'bg-ink-300'}`}>
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition ${enabled ? 'left-[18px]' : 'left-0.5'}`} />
              </span>
            </button>

            <div>
              <div className="text-sm font-semibold mb-2 flex items-center gap-2"><ListChecks size={15} /> Grant access to team members</div>
              <p className="text-xs text-ink-500 mb-2">Executives always have access. Tick others to let them import too.</p>
              <div className="space-y-1.5">
                {admins.map((a) => (
                  <label key={a.id} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ring-1 ${a.role === 'Executive' ? 'bg-ink-100 ring-ink-200 opacity-70' : 'ring-ink-200'}`}>
                    <input type="checkbox" disabled={a.role === 'Executive'} checked={a.role === 'Executive' || allowed.includes(a.id)} onChange={() => toggleUser(a.id)} />
                    <span className="flex-1">{a.name}</span>
                    <span className="text-xs text-ink-500">{a.role}</span>
                  </label>
                ))}
              </div>
            </div>
            <button onClick={save} className="btn-primary w-full">Save settings</button>
          </div>
        )}

        {!loading && tab === 'log' && (
          <div className="space-y-2">
            {log.length === 0 && <p className="text-sm text-ink-500">No import activity yet.</p>}
            {log.map((e) => (
              <div key={e.id} className="rounded-lg ring-1 ring-ink-200 dark:ring-white/10 px-3 py-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className={`badge ${e.status === 'failed' ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200' : 'bg-brand-50 text-brand-700 ring-1 ring-brand-200'}`}>{e.status}</span>
                  <span className="text-[11px] text-ink-500">{new Date(e.at).toLocaleString()}</span>
                </div>
                <div className="mt-1 font-medium line-clamp-1">{e.title || e.url}</div>
                <div className="text-[11px] text-ink-500">by {e.userName}{e.error ? ` - ${e.error}` : ''}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
