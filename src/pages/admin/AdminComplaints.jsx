import { useEffect, useMemo, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
  Search, Filter, MessageSquare, Trash2, Mail, Edit3,
  CheckCircle2, Clock, AlertCircle, Loader2, Download, UserCheck
} from 'lucide-react';
import { selectPermissions } from '../../store/authSlice';
import { isExecutive } from '../../utils/permissions';
import { COMPLAINT_STATUSES, COMPLAINT_KINDS } from '../../data/complaints';
import { allEventsCsv, downloadText } from '../../utils/ticketLog';
import { complaintsListApi, complaintDeleteApi } from '../../api/client';
import TicketDrawer from '../../components/admin/TicketDrawer';

const statusBadge = {
  new: 'bg-sky-50 text-sky-700 ring-sky-200',
  'in-progress': 'bg-amber-50 text-amber-700 ring-amber-200',
  'awaiting-customer': 'bg-purple-50 text-purple-700 ring-purple-200',
  resolved: 'bg-brand-50 text-brand-700 ring-brand-200',
  closed: 'bg-ink-100 text-ink-700 ring-ink-200'
};
const priorityBadge = {
  low: 'bg-ink-100 text-ink-700', normal: 'bg-sky-50 text-sky-700',
  high: 'bg-amber-50 text-amber-700', urgent: 'bg-rose-50 text-rose-700'
};
const statusIcon = { new: Clock, 'in-progress': Loader2, 'awaiting-customer': AlertCircle, resolved: CheckCircle2, closed: CheckCircle2 };

export default function AdminComplaints() {
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const exec = isExecutive(useSelector(selectPermissions));
  const [filter, setFilter] = useState('All');
  const [q, setQ] = useState('');
  const [openId, setOpenId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    complaintsListApi()
      .then((data) => setAll(data.complaints || []))
      .catch(() => toast.error('Failed to load complaints'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const list = useMemo(() => {
    let l = [...all];
    if (filter !== 'All') l = l.filter((c) => c.status === filter);
    if (q) {
      const s = q.toLowerCase();
      l = l.filter((c) => (c.id + (c.name || '') + (c.subject || '') + (c.message || '') + (c.orderId || '') + (c.email || '') + (c.assigneeName || '')).toLowerCase().includes(s));
    }
    return l.sort((a, b) => (b.date || b.createdAt || '').localeCompare(a.date || a.createdAt || ''));
  }, [all, filter, q]);

  const counts = useMemo(() => ({
    All: all.length,
    new: all.filter((c) => c.status === 'new').length,
    'in-progress': all.filter((c) => c.status === 'in-progress').length,
    'awaiting-customer': all.filter((c) => c.status === 'awaiting-customer').length,
    resolved: all.filter((c) => c.status === 'resolved').length,
    closed: all.filter((c) => c.status === 'closed').length,
    urgent: all.filter((c) => c.priority === 'urgent' && c.status !== 'resolved' && c.status !== 'closed').length
  }), [all]);

  const exportAll = () => { downloadText('all-ticket-activity.csv', allEventsCsv(all)); toast.success('Audit report exported'); };

  const handleDelete = async (id) => {
    if (!confirm(`Permanently delete ${id}?`)) return;
    try {
      await complaintDeleteApi(id);
      setAll((prev) => prev.filter((c) => c.id !== id));
      window.dispatchEvent(new CustomEvent('maxx:complaints-changed'));
      toast.success('Deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-extrabold">Complaints ({list.length})</h1>
          <p className="text-xs text-ink-500">Full traceability - timeline, change history, handler chain and audit per ticket.</p>
        </div>
        <div className="flex items-center gap-2">
          {exec && <button onClick={exportAll} className="btn-outline !py-2 !px-3 text-sm"><Download size={14} /> Audit CSV</button>}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tickets..." className="input pl-9 !py-2 !text-sm w-56" />
          </div>
        </div>
      </header>

      <div className="grid sm:grid-cols-4 gap-3">
        <Stat label="New" value={counts.new} tone="sky" />
        <Stat label="In Progress" value={counts['in-progress']} tone="amber" />
        <Stat label="Awaiting Cust." value={counts['awaiting-customer']} tone="purple" />
        <Stat label="Urgent Open" value={counts.urgent} tone="rose" />
      </div>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        <Filter size={14} className="text-ink-500" />
        {['All', ...COMPLAINT_STATUSES].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition whitespace-nowrap capitalize ${filter === f ? 'bg-brand-500 text-white border-transparent' : 'bg-white dark:bg-ink-900 border-ink-200 dark:border-white/10 hover:border-brand-300'}`}>
            {f.replace(/-/g, ' ')} ({counts[f] ?? 0})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card p-10 text-center text-ink-500 text-sm">Loading complaints…</div>
      ) : (
        <div className="space-y-3">
          {list.length === 0 ? (
            <div className="card p-10 text-center text-ink-500">
              <MessageSquare size={36} className="mx-auto opacity-40 mb-2" />
              <p className="text-sm">No tickets match your filter.</p>
            </div>
          ) : list.map((c) => {
            const Icon = statusIcon[c.status] || Clock;
            const kindLabel = COMPLAINT_KINDS.find((k) => k.value === c.kind)?.label || c.kind;
            return (
              <div key={c.id} className="card p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <code className="font-mono font-bold">{c.id}</code>
                      <span className={`badge ring-1 inline-flex items-center gap-1 ${statusBadge[c.status]}`}>
                        <Icon size={11} className={c.status === 'in-progress' ? 'animate-spin' : ''} />
                        {c.status.replace(/-/g, ' ')}
                      </span>
                      <span className={`badge ${priorityBadge[c.priority]} uppercase`}>{c.priority}</span>
                      <span className="badge bg-indigo-50 text-indigo-700"><UserCheck size={11} /> {c.assigneeName || 'Unassigned'}</span>
                      {c.orderId && <span className="badge bg-ink-100 text-ink-700">Order: {c.orderId}</span>}
                    </div>
                    <h3 className="font-bold mt-2">{c.subject}</h3>
                    <div className="text-xs text-ink-500 mt-0.5">{kindLabel}</div>
                    <div className="text-xs text-ink-500 mt-2">
                      <b>{c.name}</b> - {c.phone || 'no phone'} {c.email && `- ${c.email}`} {c.city && `- ${c.city}`} - <i>{c.date || (c.createdAt ? String(c.createdAt).slice(0, 10) : '')}</i>
                    </div>
                    <p className="text-sm text-ink-700 dark:text-ink-200 mt-3 line-clamp-2">{c.message}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-wrap">
                    <button onClick={() => setOpenId(c.id)} className="btn-primary !py-1.5 !px-3 text-xs"><Edit3 size={13} /> Open</button>
                    <a href={`mailto:${c.email}?subject=${encodeURIComponent('Re: ticket ' + c.id)}&body=${encodeURIComponent('Hi ' + c.name + ',\n\n')}`} className="btn-ghost !p-2" title="Email customer"><Mail size={14} /></a>
                    {exec && (
                      <button onClick={() => handleDelete(c.id)} className="btn-ghost !p-2 text-red-500" title="Delete (executive)"><Trash2 size={14} /></button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {openId && (
        <TicketDrawer
          ticketId={openId}
          onClose={() => { setOpenId(null); load(); }}
        />
      )}
    </div>
  );
}

function Stat({ label, value, tone }) {
  const palette = { sky: 'bg-sky-50 text-sky-700', amber: 'bg-amber-50 text-amber-700', purple: 'bg-purple-50 text-purple-700', rose: 'bg-rose-50 text-rose-700' };
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-ink-500 font-bold">{label}</div>
          <div className="text-2xl font-extrabold mt-1">{value}</div>
        </div>
        <span className={`grid place-items-center w-9 h-9 rounded-xl ${palette[tone]}`}><MessageSquare size={14} /></span>
      </div>
    </div>
  );
}
