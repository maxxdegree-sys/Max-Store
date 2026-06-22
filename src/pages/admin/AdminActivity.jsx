import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Activity, Search, LogIn, LogOut, Boxes, MessageSquare, Mail, UserCog, Dot
} from 'lucide-react';
import { activityLogApi } from '../../api/client';
import RequirePermission from '../../components/admin/RequirePermission';

const actionMeta = {
  login:     { icon: LogIn,         color: 'text-brand-700 bg-brand-50' },
  logout:    { icon: LogOut,        color: 'text-ink-600 bg-ink-100' },
  product:   { icon: Boxes,         color: 'text-sky-700 bg-sky-50' },
  complaint: { icon: MessageSquare, color: 'text-amber-700 bg-amber-50' },
  email:     { icon: Mail,          color: 'text-purple-700 bg-purple-50' },
  team:      { icon: UserCog,       color: 'text-rose-700 bg-rose-50' },
  action:    { icon: Dot,           color: 'text-ink-600 bg-ink-100' }
};

function AdminActivityInner() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [userFilter, setUserFilter] = useState('All');
  const [actionFilter, setActionFilter] = useState('All');

  useEffect(() => {
    setLoading(true);
    activityLogApi({ limit: 500 })
      .then((data) => setItems(data.log || data.activity || []))
      .catch(() => toast.error('Failed to load activity log'))
      .finally(() => setLoading(false));
  }, []);

  const users = useMemo(() => ['All', ...new Set(items.map((i) => i.user_name).filter(Boolean))], [items]);
  const actionTypes = useMemo(() => ['All', ...new Set(items.map((i) => i.action).filter(Boolean))], [items]);

  const list = useMemo(() => {
    let l = [...items];
    if (userFilter !== 'All')   l = l.filter((i) => (i.user_name) === userFilter);
    if (actionFilter !== 'All') l = l.filter((i) => i.action === actionFilter);
    if (q) {
      const s = q.toLowerCase();
      l = l.filter((i) => ((i.user_name || '') + (i.action || '') + (i.note || '')).toLowerCase().includes(s));
    }
    return l;
  }, [items, q, userFilter, actionFilter]);

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-extrabold flex items-center gap-2"><Activity size={20} className="text-brand-700" /> Activity Log ({list.length})</h1>
          <p className="text-xs text-ink-500">Login/logout and key actions across the whole team.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search log..." className="input pl-9 !py-2 !text-sm w-52" />
          </div>
          <select value={userFilter} onChange={(e) => setUserFilter(e.target.value)} className="input !py-2 !px-3 !text-sm w-auto">
            {users.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
          <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="input !py-2 !px-3 !text-sm w-auto capitalize">
            {actionTypes.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </header>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-ink-500 text-sm">Loading activity log…</div>
        ) : list.length === 0 ? (
          <div className="p-10 text-center text-ink-500 text-sm">No activity matches your filter.</div>
        ) : (
          <ol className="divide-y divide-ink-100 dark:divide-white/10">
            {list.map((a, idx) => {
              const actionKey = (a.action || '').split('.')[0];
              const meta = actionMeta[actionKey] || actionMeta.action;
              const Icon = meta.icon;
              const name = a.user_name || 'System';
              const ts = a.at || '';
              return (
                <li key={a.id || idx} className="flex items-center gap-3 px-4 py-3">
                  <span className={`grid place-items-center w-9 h-9 rounded-xl shrink-0 ${meta.color}`}><Icon size={15} /></span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm"><b>{name}</b> <span className="text-ink-500">{a.note || a.action}</span></div>
                    <div className="text-[11px] text-ink-500 uppercase tracking-wider">{a.action}</div>
                  </div>
                  <time className="text-xs text-ink-500 shrink-0 font-mono">{typeof ts === 'string' ? ts.slice(0, 19).replace('T', ' ') : ts}</time>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}

export default function AdminActivity() {
  return (
    <RequirePermission permission="activity">
      <AdminActivityInner />
    </RequirePermission>
  );
}
