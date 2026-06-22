import { createSlice } from '@reduxjs/toolkit';
import { complaints as seed } from '../data/complaints';

// Generate a ticket ID like AR-2026-0042
function genTicketId(existingItems) {
  const year = new Date().getFullYear();
  const yearTickets = existingItems.filter((c) => c.id.startsWith(`AR-${year}-`));
  const max = yearTickets.reduce((m, c) => {
    const n = parseInt(c.id.split('-')[2], 10) || 0;
    return n > m ? n : m;
  }, 0);
  return `AR-${year}-${String(max + 1).padStart(4, '0')}`;
}

// Build one immutable, time-stamped activity-log entry.
function mkEvent({ action, detail = '', actor = {}, field, from, to }) {
  const ev = {
    id: (globalThis.crypto?.randomUUID?.() || String(Date.now() + Math.random())),
    at: new Date().toISOString(),
    action, detail,
    by: actor.name || 'System', role: actor.role || '', dept: actor.department || '',
    session: actor.session || '', device: actor.device || ''
  };
  if (field !== undefined) ev.field = field;
  if (from !== undefined) ev.from = from;
  if (to !== undefined) ev.to = to;
  return ev;
}

// Make sure traceability fields exist (self-heals tickets persisted before this feature).
function ensure(c) {
  if (!Array.isArray(c.events)) c.events = [];
  if (!Array.isArray(c.notes)) c.notes = [];
  if (!Array.isArray(c.handlerHistory)) c.handlerHistory = [];
  if (!Array.isArray(c.changeHistory)) c.changeHistory = [];
}
function record(c, { actor, field, from, to }) {
  c.changeHistory.unshift({ at: new Date().toISOString(), by: actor?.name || 'System', field, from, to });
}

const complaintsSlice = createSlice({
  name: 'complaints',
  initialState: { items: seed },
  reducers: {
    submitComplaint: {
      reducer(state, { payload }) { state.items.unshift(payload); },
      prepare(input) {
        const id = genTicketId(seed);
        const openedBy = (input.name || 'Customer').trim() || 'Customer';
        return {
          payload: {
            id,
            orderId:   (input.orderId || '').trim(),
            productId: (input.productId || '').trim(),
            name:      (input.name || '').trim(),
            email:     (input.email || '').trim(),
            phone:     (input.phone || '').trim(),
            city:      (input.city || '').trim(),
            kind:      input.kind || 'other',
            subject:   (input.subject || '').trim(),
            message:   (input.message || '').trim(),
            status:    'new',
            priority:  input.priority || 'normal',
            date:      new Date().toISOString().slice(0, 10),
            replies:   [],
            internalNotes: '',
            assignee: null, assigneeName: '', assigneeDept: '',
            notes: [], handlerHistory: [], changeHistory: [],
            events: [mkEvent({ action: 'opened', detail: 'Ticket opened by customer', actor: { name: openedBy, role: 'Customer' } })]
          }
        };
      }
    },
    addReply(state, { payload }) {
      const c = state.items.find((x) => x.id === payload.id);
      if (!c) return;
      ensure(c);
      const fromUs = payload.who !== 'Customer';
      c.replies.push({ who: payload.who || 'Maxx Support', date: new Date().toISOString().slice(0, 10), text: payload.text });
      c.events.unshift(mkEvent({
        action: 'reply',
        detail: fromUs ? 'Replied to customer' : 'Customer replied',
        actor: payload.actor || { name: payload.who || 'Customer', role: fromUs ? '' : 'Customer' }
      }));
      if (fromUs && c.status === 'new') {
        record(c, { actor: payload.actor, field: 'status', from: 'new', to: 'in-progress' });
        c.events.unshift(mkEvent({ action: 'status', detail: 'Auto-advanced on first reply', actor: payload.actor || {}, field: 'status', from: 'new', to: 'in-progress' }));
        c.status = 'in-progress';
      }
    },
    setStatus(state, { payload }) {
      const c = state.items.find((x) => x.id === payload.id);
      if (!c || c.status === payload.status) return;
      ensure(c);
      const from = c.status, to = payload.status;
      const action = to === 'closed' ? 'closed' : ((from === 'closed' || from === 'resolved') ? 'reopen' : 'status');
      record(c, { actor: payload.actor, field: 'status', from, to });
      c.events.unshift(mkEvent({ action, detail: `Status changed from ${from} to ${to}`, actor: payload.actor || {}, field: 'status', from, to }));
      c.status = to;
    },
    setPriority(state, { payload }) {
      const c = state.items.find((x) => x.id === payload.id);
      if (!c || c.priority === payload.priority) return;
      ensure(c);
      const from = c.priority, to = payload.priority;
      record(c, { actor: payload.actor, field: 'priority', from, to });
      c.events.unshift(mkEvent({ action: 'priority', detail: `Priority changed from ${from} to ${to}`, actor: payload.actor || {}, field: 'priority', from, to }));
      c.priority = to;
    },
    escalateTicket(state, { payload }) {
      const c = state.items.find((x) => x.id === payload.id);
      if (!c) return;
      ensure(c);
      if (c.priority !== 'urgent') { record(c, { actor: payload.actor, field: 'priority', from: c.priority, to: 'urgent' }); c.priority = 'urgent'; }
      if (c.status === 'new') c.status = 'in-progress';
      c.events.unshift(mkEvent({ action: 'escalate', detail: 'Ticket escalated to urgent', actor: payload.actor || {} }));
    },
    assignTicket(state, { payload }) {
      const c = state.items.find((x) => x.id === payload.id);
      if (!c) return;
      ensure(c);
      const a = payload.assignee || {};
      const fromName = c.assigneeName || null;
      c.handlerHistory.unshift({ at: new Date().toISOString(), from: fromName, to: a.name || '', by: payload.actor?.name || 'System' });
      c.assignee = a.id || null; c.assigneeName = a.name || ''; c.assigneeDept = a.department || '';
      c.events.unshift(mkEvent({ action: 'assign', detail: `Assigned to ${a.name || 'unassigned'}${a.department ? ' (' + a.department + ')' : ''}`, actor: payload.actor || {}, from: fromName || '', to: a.name || '' }));
    },
    addInternalNote(state, { payload }) {
      const c = state.items.find((x) => x.id === payload.id);
      if (!c) return;
      ensure(c);
      const confidential = !!payload.confidential;
      c.notes.unshift({
        id: (globalThis.crypto?.randomUUID?.() || String(Date.now())),
        at: new Date().toISOString(),
        by: payload.actor?.name || 'Admin', role: payload.actor?.role || '', dept: payload.actor?.department || '',
        confidential, text: payload.text || ''
      });
      c.events.unshift(mkEvent({ action: 'note', detail: confidential ? 'Confidential executive note added' : 'Internal note added', actor: payload.actor || {} }));
    },
    setInternalNotes(state, { payload }) { // legacy single-field notes
      const c = state.items.find((x) => x.id === payload.id);
      if (!c) return;
      ensure(c);
      c.internalNotes = payload.notes;
      c.events.unshift(mkEvent({ action: 'note', detail: 'Updated internal notes', actor: payload.actor || {} }));
    },
    updateTicketFields(state, { payload }) {
      const c = state.items.find((x) => x.id === payload.id);
      if (!c) return;
      ensure(c);
      Object.entries(payload.changes || {}).forEach(([field, to]) => {
        const from = c[field];
        if (from === to) return;
        record(c, { actor: payload.actor, field, from, to });
        c.events.unshift(mkEvent({ action: 'edit', detail: `Edited ${field}`, actor: payload.actor || {}, field, from: from ?? '', to: to ?? '' }));
        c[field] = to;
      });
    },
    deleteComplaint(state, { payload }) {
      state.items = state.items.filter((x) => x.id !== payload);
    }
  }
});

export const {
  submitComplaint, addReply, setStatus, setPriority, escalateTicket,
  assignTicket, addInternalNote, setInternalNotes, updateTicketFields, deleteComplaint
} = complaintsSlice.actions;

export const selectAllComplaints = (s) => s.complaints.items;
export const selectComplaintById = (id) => (s) => s.complaints.items.find((c) => c.id === id);
export const selectComplaintsByStatus = (status) => (s) => s.complaints.items.filter((c) => c.status === status);
export const selectOpenComplaintCount = (s) => s.complaints.items.filter((c) => c.status !== 'resolved' && c.status !== 'closed').length;

export default complaintsSlice.reducer;
