import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { X, Send, Download, AlertTriangle, UserCheck, ArrowRight, Lock, Clock } from 'lucide-react';
import { selectUser, selectPermissions } from '../../store/authSlice';
import { isExecutive } from '../../utils/permissions';
import { COMPLAINT_STATUSES, COMPLAINT_PRIORITIES } from '../../data/complaints';
import { ticketEventsCsv, downloadText } from '../../utils/ticketLog';
import { notifyTicketReply } from '../../utils/notify';
import { complaintGetApi, complaintUpdateApi, teamAssigneesApi } from '../../api/client';
import TicketActivity from './TicketActivity';

const PENDING = {
  new: 'Awaiting first response', 'in-progress': 'Being worked on',
  'awaiting-customer': 'Waiting on customer reply', resolved: 'Resolved - awaiting close', closed: 'None'
};
const fmt = (iso) => { try { return new Date(iso).toLocaleString(); } catch { return iso; } };

export default function TicketDrawer({ ticketId, onClose }) {
  const [ticket, setTicket] = useState(null);
  const [saving, setSaving] = useState(false);
  const user = useSelector(selectUser);
  const exec = isExecutive(useSelector(selectPermissions));
  const [team, setTeam] = useState([]);

  const [tab, setTab] = useState('timeline');
  const [reply, setReply] = useState('');
  const [note, setNote] = useState('');
  const [confidential, setConfidential] = useState(false);

  useEffect(() => {
    if (!ticketId) return;
    complaintGetApi(ticketId)
      .then((data) => setTicket(data.complaint))
      .catch(() => toast.error('Could not load ticket'));
  }, [ticketId]);

  useEffect(() => {
    teamAssigneesApi()
      .then((data) => setTeam(data.users || []))
      .catch(() => {});
  }, []);

  const notifyComplaintsChanged = () => {
    window.dispatchEvent(new CustomEvent('maxx:complaints-changed'));
  };

  const patch = async (updates) => {
    if (!ticket) return;
    setSaving(true);
    try {
      const data = await complaintUpdateApi(ticket.id, updates);
      setTicket(data.complaint);
      notifyComplaintsChanged();
    } catch (err) {
      toast.error(err.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (!ticket) return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white dark:bg-ink-900 shadow-2xl flex items-center justify-center">
        <div className="text-ink-500 text-sm">Loading ticket…</div>
      </aside>
    </div>
  );

  const events = ticket.events || [];
  const notes = (ticket.notes || []).filter((n) => exec || !n.confidential);
  const tabs = ['timeline', 'conversation', 'changes', 'notes', ...(exec ? ['audit'] : [])];

  const sendReply = async () => {
    if (reply.trim().length < 3) return toast.error('Type your reply');
    await patch({ reply: reply.trim() });
    notifyTicketReply(ticket, reply.trim());
    setReply('');
    toast.success('Reply sent to customer');
  };

  const changeStatus = (s) => { patch({ status: s }); toast.success('Status: ' + s.replace(/-/g, ' ')); };
  const changePriority = (p) => { patch({ priority: p }); toast.success('Priority: ' + p); };
  const escalate = () => { patch({ priority: 'urgent' }); toast('Escalated to urgent', { icon: '!' }); };

  const assign = (uid) => {
    const m = team.find((u) => u.id === uid);
    patch({ assignee: m ? { id: m.id, name: m.name, department: m.department } : { id: '', name: '', department: '' } });
    toast.success(m ? 'Assigned to ' + m.name : 'Unassigned');
  };

  const saveNote = async () => {
    if (note.trim().length < 2) return toast.error('Write a note');
    await patch({ internalNote: note.trim(), confidential });
    setNote(''); setConfidential(false);
    toast.success('Note added');
  };

  const exportCsv = () => {
    downloadText('ticket-' + ticket.id + '-activity.csv', ticketEventsCsv(ticket));
    toast.success('Activity exported');
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white dark:bg-ink-900 shadow-2xl overflow-y-auto">
        <header className="sticky top-0 bg-white dark:bg-ink-900 z-10 px-6 py-4 border-b border-ink-100 dark:border-white/10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <code className="font-mono font-bold">{ticket.id}</code>
              <h2 className="font-bold mt-1">{ticket.subject}</h2>
              <p className="text-xs text-ink-500 mt-0.5">From {ticket.name} - opened {ticket.date}</p>
            </div>
            <button onClick={onClose} className="btn-ghost !p-2"><X /></button>
          </div>
          <div className="flex items-center gap-2 mt-3 flex-wrap text-xs">
            <span className="badge bg-ink-100 text-ink-700 capitalize">{ticket.status.replace(/-/g, ' ')}</span>
            <span className="badge bg-ink-100 text-ink-700 uppercase">{ticket.priority}</span>
            <span className="badge bg-indigo-50 text-indigo-700"><UserCheck size={11} /> {ticket.assigneeName || 'Unassigned'}</span>
            {saving && <span className="text-ink-400 text-[10px]">Saving…</span>}
            <button onClick={exportCsv} className="btn-ghost !py-1 !px-2 ml-auto"><Download size={13} /> CSV</button>
          </div>
        </header>

        <div className="p-6 space-y-5">
          <div className="grid sm:grid-cols-3 gap-3">
            <label className="text-sm block"><div className="font-semibold mb-1">Status</div>
              <select className="input" value={ticket.status} onChange={(e) => changeStatus(e.target.value)}>
                {COMPLAINT_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/-/g, ' ')}</option>)}
              </select>
            </label>
            <label className="text-sm block"><div className="font-semibold mb-1">Priority</div>
              <select className="input" value={ticket.priority} onChange={(e) => changePriority(e.target.value)}>
                {COMPLAINT_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
            <label className="text-sm block"><div className="font-semibold mb-1">Assign to</div>
              <select className="input" value={ticket.assignee || ''} onChange={(e) => assign(e.target.value)}>
                <option value="">Unassigned</option>
                {team.map((u) => <option key={u.id} value={u.id}>{u.name} - {u.department}</option>)}
              </select>
            </label>
          </div>
          <button onClick={escalate} className="btn-outline !py-2 text-sm text-rose-600 border-rose-200"><AlertTriangle size={14} /> Escalate to urgent</button>

          <div className="card p-4 text-sm">
            <h3 className="font-bold mb-2 flex items-center gap-2"><UserCheck size={15} /> Responsibility chain</h3>
            <div className="grid sm:grid-cols-2 gap-y-1 text-xs">
              <div><span className="text-ink-500">Current handler: </span><b>{ticket.assigneeName || 'Unassigned'}</b></div>
              <div><span className="text-ink-500">Pending action: </span><b>{PENDING[ticket.status] || '-'}</b></div>
            </div>
            {(ticket.handlerHistory || []).length > 0 && (
              <ul className="mt-2 space-y-1 text-[11px] text-ink-500">
                {ticket.handlerHistory.map((h, i) => (
                  <li key={i} className="flex items-center gap-1">
                    <Clock size={10} /> {fmt(h.at)} - {h.from || 'Unassigned'} <ArrowRight size={10} /> {h.to || 'Unassigned'} <span className="opacity-70">by {h.by}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex gap-1 p-1 rounded-xl bg-ink-100 dark:bg-white/5 text-xs overflow-x-auto">
            {tabs.map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`flex-1 py-1.5 px-2 rounded-lg font-semibold capitalize whitespace-nowrap ${tab === t ? 'bg-white dark:bg-ink-800 shadow' : ''}`}>
                {t === 'audit' ? 'Audit (exec)' : t}
              </button>
            ))}
          </div>

          {tab === 'timeline' && <TicketActivity mode="timeline" events={events} />}
          {tab === 'audit' && exec && <TicketActivity mode="audit" events={events} />}

          {tab === 'conversation' && (
            <div>
              {(ticket.replies || []).length === 0 ? <div className="text-sm text-ink-500 italic">No replies yet.</div> : (
                <ol className="space-y-2">
                  {ticket.replies.map((r, i) => {
                    const fromUs = r.who !== 'Customer';
                    return (
                      <li key={i} className={`flex ${fromUs ? '' : 'justify-end'}`}>
                        <div className={`max-w-[80%] rounded-xl p-3 ${fromUs ? 'bg-brand-50 dark:bg-brand-900/20' : 'bg-ink-100 dark:bg-white/5'}`}>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">{r.who} - {r.date}</div>
                          <p className="mt-1 text-sm whitespace-pre-line">{r.text}</p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
              <textarea rows={3} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Reply to customer..." className="input mt-3" maxLength={1000} />
              <button onClick={sendReply} disabled={saving} className="btn-primary mt-2 !py-2 text-sm"><Send size={14} /> Send Reply</button>
            </div>
          )}

          {tab === 'changes' && (
            <div className="space-y-2">
              {(ticket.changeHistory || []).length === 0 && <p className="text-sm text-ink-500">No field changes recorded.</p>}
              {(ticket.changeHistory || []).map((h, i) => (
                <div key={i} className="rounded-lg ring-1 ring-ink-200 dark:ring-white/10 p-3 text-sm">
                  <div className="flex items-center justify-between"><b className="capitalize">{h.field}</b><span className="text-[11px] text-ink-500">{fmt(h.at)}</span></div>
                  <div className="text-xs mt-1">
                    <span className="line-through bg-rose-50 text-rose-700 px-1 rounded">{String(h.from) || 'empty'}</span>
                    <ArrowRight size={11} className="inline mx-1" />
                    <span className="bg-brand-50 text-brand-700 px-1 rounded">{String(h.to) || 'empty'}</span>
                  </div>
                  <div className="text-[11px] text-ink-500 mt-1">by {h.by}</div>
                </div>
              ))}
            </div>
          )}

          {tab === 'notes' && (
            <div className="space-y-3">
              {ticket.internalNotes && <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 p-3 text-sm">{ticket.internalNotes}</div>}
              {notes.length === 0 && !ticket.internalNotes && <p className="text-sm text-ink-500">No internal notes yet.</p>}
              {notes.map((n) => (
                <div key={n.id} className={`rounded-lg p-3 text-sm ring-1 ${n.confidential ? 'bg-rose-50 ring-rose-200' : 'bg-amber-50 dark:bg-amber-900/20 ring-amber-200'}`}>
                  {n.confidential && <span className="badge bg-rose-100 text-rose-700 mb-1"><Lock size={10} /> Executive only</span>}
                  <p className="whitespace-pre-line">{n.text}</p>
                  <div className="text-[11px] text-ink-500 mt-1">by {n.by}{n.role ? ` - ${n.role}` : ''} - {fmt(n.at)}</div>
                </div>
              ))}
              <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add an internal note (not visible to customer)..." className="input" />
              <div className="flex items-center justify-between">
                {exec ? (
                  <label className="text-xs flex items-center gap-2"><input type="checkbox" checked={confidential} onChange={(e) => setConfidential(e.target.checked)} /> Confidential (executive only)</label>
                ) : <span />}
                <button onClick={saveNote} disabled={saving} className="btn-outline !py-1.5 !px-3 text-xs">Add note</button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
