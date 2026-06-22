import { useState } from 'react';
import { Search, ArrowRight, Shield } from 'lucide-react';
import { actionMeta } from '../../utils/ticketLog';

const fmt = (iso) => { try { return new Date(iso).toLocaleString(); } catch { return iso; } };

// Renders the ticket activity log. mode 'timeline' = color-coded, searchable
// timeline; mode 'audit' = full executive audit view incl. device/session.
export default function TicketActivity({ events = [], mode = 'timeline' }) {
  const [q, setQ] = useState('');
  const [actionF, setActionF] = useState('all');

  if (mode === 'audit') {
    return (
      <div className="space-y-2">
        <div className="rounded-lg bg-ink-900 text-white/90 p-3 text-xs flex items-center gap-2">
          <Shield size={14} /> Executive Audit View - full trace incl. device &amp; session. Hidden from standard staff.
        </div>
        {events.map((e) => (
          <div key={e.id} className="rounded-lg ring-1 ring-ink-200 dark:ring-white/10 p-2 text-[11px]">
            <div className="flex items-center justify-between"><b>{actionMeta(e.action).label}</b><span className="text-ink-500">{fmt(e.at)}</span></div>
            <div className="mt-0.5">{e.detail}</div>
            <div className="text-ink-500 mt-0.5">by {e.by} ({e.role || 'n/a'} / {e.dept || 'n/a'}) - session {e.session || 'n/a'}</div>
            <div className="text-ink-400 truncate">device: {e.device || 'n/a'}</div>
          </div>
        ))}
      </div>
    );
  }

  const shown = events.filter((e) =>
    (actionF === 'all' || e.action === actionF) &&
    (!q || (e.by + e.detail + e.action + (e.field || '')).toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search activity..." className="input pl-8 !py-1.5 !text-xs" />
        </div>
        <select className="input !py-1.5 !text-xs w-32" value={actionF} onChange={(e) => setActionF(e.target.value)}>
          <option value="all">All actions</option>
          {['opened', 'reply', 'status', 'priority', 'assign', 'note', 'edit', 'escalate'].map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
      <ol className="relative border-l-2 border-ink-100 dark:border-white/10 ml-2 space-y-3">
        {shown.length === 0 && <li className="text-sm text-ink-500 pl-4">No activity.</li>}
        {shown.map((e) => {
          const m = actionMeta(e.action);
          return (
            <li key={e.id} className="pl-4 relative">
              <span className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-brand-500 ring-2 ring-white dark:ring-ink-900" />
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`badge ring-1 ${m.cls}`}>{m.label}</span>
                <span className="text-[11px] text-ink-500">{fmt(e.at)}</span>
              </div>
              <div className="text-sm mt-0.5">
                {e.detail}
                {e.from !== undefined && e.to !== undefined ? <span className="text-ink-500"> ({String(e.from) || 'empty'} <ArrowRight size={10} className="inline" /> {String(e.to) || 'empty'})</span> : null}
              </div>
              <div className="text-[11px] text-ink-500">by <b>{e.by}</b>{e.role ? ` - ${e.role}` : ''}{e.dept ? ` - ${e.dept}` : ''}</div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
