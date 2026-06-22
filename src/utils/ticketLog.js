// Helpers for the ticket activity-log / traceability system.

// A stable per-browser session id (stands in for server-side session tracking).
export function getSessionId() {
  try {
    let s = localStorage.getItem('maxx-session') || localStorage.getItem('alrafiq-session');
    if (!s) { s = (window.crypto?.randomUUID?.() || String(Date.now())).slice(0, 8); localStorage.setItem('maxx-session', s); }
    else if (!localStorage.getItem('maxx-session')) localStorage.setItem('maxx-session', s);
    return s;
  } catch { return 'na'; }
}

// Build the "who did it" stamp attached to every logged action.
export function getActor(user) {
  const ua = (typeof navigator !== 'undefined' ? navigator.userAgent : '').slice(0, 90);
  return {
    uid: user?.uid || user?.id || null,
    name: user?.name || 'Admin',
    role: user?.role || '',
    department: user?.department || '',
    session: getSessionId(),
    device: ua
  };
}

// Action -> label + badge classes (color-coded timeline).
export const ACTION_META = {
  opened:   { label: 'Opened',    cls: 'bg-sky-50 text-sky-700 ring-sky-200' },
  reply:    { label: 'Reply',     cls: 'bg-brand-50 text-brand-700 ring-brand-200' },
  status:   { label: 'Status',    cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
  priority: { label: 'Priority',  cls: 'bg-purple-50 text-purple-700 ring-purple-200' },
  assign:   { label: 'Assigned',  cls: 'bg-indigo-50 text-indigo-700 ring-indigo-200' },
  note:     { label: 'Note',      cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
  edit:     { label: 'Edited',    cls: 'bg-slate-100 text-slate-700 ring-slate-200' },
  escalate: { label: 'Escalated', cls: 'bg-rose-50 text-rose-700 ring-rose-200' },
  closed:   { label: 'Closed',    cls: 'bg-ink-100 text-ink-700 ring-ink-200' },
  reopen:   { label: 'Reopened',  cls: 'bg-sky-50 text-sky-700 ring-sky-200' }
};
export const actionMeta = (a) => ACTION_META[a] || { label: a, cls: 'bg-ink-100 text-ink-700 ring-ink-200' };

// CSV helpers ----------------------------------------------------------------
function esc(v) { const s = String(v ?? ''); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
const HEAD = ['Ticket', 'DateTime', 'Action', 'By', 'Role', 'Dept', 'Field', 'From', 'To', 'Detail', 'Session', 'Device'];
const rowOf = (id, e) => [id, e.at, e.action, e.by, e.role, e.dept, e.field || '', e.from ?? '', e.to ?? '', e.detail || '', e.session || '', e.device || ''];

export function ticketEventsCsv(ticket) {
  const rows = (ticket.events || []).map((e) => rowOf(ticket.id, e));
  return [HEAD, ...rows].map((r) => r.map(esc).join(',')).join('\n');
}
export function allEventsCsv(tickets) {
  const rows = [];
  tickets.forEach((t) => (t.events || []).forEach((e) => rows.push(rowOf(t.id, e))));
  rows.sort((a, b) => String(b[1]).localeCompare(String(a[1])));
  return [HEAD, ...rows].map((r) => r.map(esc).join(',')).join('\n');
}

export function downloadText(filename, text, mime = 'text/csv') {
  const blob = new Blob([text], { type: mime + ';charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
