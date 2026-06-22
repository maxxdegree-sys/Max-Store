import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Search, Ticket, Clock, CheckCircle2, AlertCircle, Loader2, Mail } from 'lucide-react';
import { complaintTrackApi } from '../api/client';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import SEO from '../components/seo/SEO';
import { BUSINESS } from '../utils/format';

const statusBadge = {
  new:                  'bg-sky-50 text-sky-700 ring-sky-200',
  'in-progress':        'bg-amber-50 text-amber-700 ring-amber-200',
  'awaiting-customer':  'bg-purple-50 text-purple-700 ring-purple-200',
  resolved:             'bg-brand-50 text-brand-700 ring-brand-200',
  closed:               'bg-ink-100 text-ink-700 ring-ink-200'
};

const statusIcon = {
  new: Clock,
  'in-progress': Loader2,
  'awaiting-customer': AlertCircle,
  resolved: CheckCircle2,
  closed: CheckCircle2
};

export default function TicketTracking() {
  const [params, setParams] = useSearchParams();
  const initial = params.get('id') || '';
  const [query, setQuery] = useState(initial);
  const [ticket, setTicket] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setQuery(initial);
    if (!initial) { setTicket(null); setNotFound(false); return; }
    setLoading(true);
    setNotFound(false);
    complaintTrackApi(initial)
      .then((d) => { setTicket(d.ticket); setLoading(false); })
      .catch((err) => {
        setLoading(false);
        if (err.status === 404) setNotFound(true);
        else toast.error(err.message || 'Could not fetch ticket');
      });
  }, [initial]);

  const search = (e) => {
    e?.preventDefault();
    if (!query.trim()) return toast.error('Enter your ticket ID');
    setParams({ id: query.trim().toUpperCase() });
  };

  const StatusIcon = ticket ? (statusIcon[ticket.status] || Clock) : Clock;

  return (
    <>
      <SEO title="Track Your Ticket" description="Track the status of a complaint or support request." />
      <Breadcrumbs items={[{ to: '/contact', label: 'Help' }, { label: 'Track Ticket' }]} />

      <div className="container-px py-6 pb-14 max-w-3xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-2">
          <Ticket className="text-brand-700" /> Track Your Ticket
        </h1>
        <p className="text-ink-500 mt-1 text-sm">Enter the ticket ID we generated when you filed your complaint.</p>

        <form onSubmit={search} className="mt-5 flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. AR-2026-0001"
              className="input pl-9 uppercase font-mono"
            />
          </div>
          <button className="btn-primary">Track</button>
        </form>

        {loading && (
          <div className="card p-8 text-center mt-6 text-ink-500 text-sm">Looking up ticket…</div>
        )}

        {!loading && notFound && (
          <div className="card p-8 text-center mt-6">
            <AlertCircle size={36} className="mx-auto text-amber-500 opacity-70" />
            <p className="mt-3 font-semibold">No ticket found with ID <code className="font-mono">{initial}</code></p>
            <p className="text-sm text-ink-500 mt-1">Double-check your ticket ID. IDs look like AR-2026-0001.</p>
            <Link to="/complaint" className="btn-outline mt-4 inline-flex">File a new complaint</Link>
          </div>
        )}

        {ticket && (
          <article className="card mt-6">
            <header className="p-5 border-b border-ink-100 dark:border-white/10 flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <div className="text-xs font-bold uppercase tracking-widest text-ink-500">Ticket</div>
                <h2 className="font-mono font-extrabold text-xl">{ticket.id}</h2>
                <p className="text-sm text-ink-700 dark:text-ink-200 mt-1">{ticket.subject}</p>
                <p className="text-xs text-ink-500 mt-1">Filed on {ticket.date} - {(ticket.kind || '').replace(/-/g, ' ')}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`badge ring-1 inline-flex items-center gap-1 ${statusBadge[ticket.status] || ''}`}>
                  <StatusIcon size={12} className={ticket.status === 'in-progress' ? 'animate-spin' : ''} />
                  {(ticket.status || '').replace(/-/g, ' ')}
                </span>
                <span className="text-[11px] text-ink-500 uppercase tracking-wider">Priority: <b>{ticket.priority}</b></span>
              </div>
            </header>

            {/* Status timeline */}
            <div className="px-5 pt-5">
              <ol className="grid grid-cols-4 gap-1 mb-4">
                {[
                  { k: 'new',               l: 'Filed' },
                  { k: 'in-progress',       l: 'Under Review' },
                  { k: 'awaiting-customer', l: 'Action Needed' },
                  { k: 'resolved',          l: 'Resolved' }
                ].map((s, i, arr) => {
                  const reached = arr.findIndex((x) => x.k === ticket.status) >= i
                    || (ticket.status === 'closed' && i < arr.length);
                  return (
                    <li key={s.k} className="flex flex-col items-center text-center">
                      <span className={`grid place-items-center w-8 h-8 rounded-full text-[11px] font-bold ${reached ? 'bg-brand-500 text-white' : 'bg-ink-100 text-ink-400'}`}>{i + 1}</span>
                      <span className={`mt-1 text-[10px] font-semibold uppercase tracking-wider ${reached ? '' : 'text-ink-400'}`}>{s.l}</span>
                    </li>
                  );
                })}
              </ol>
            </div>

            {ticket.message && (
              <section className="px-5 pb-3">
                <h3 className="font-bold text-sm">Your message</h3>
                <p className="text-sm mt-1 text-ink-700 dark:text-ink-200 whitespace-pre-line leading-relaxed">{ticket.message}</p>
              </section>
            )}

            {/* Reply thread */}
            <section className="px-5 py-4 border-t border-ink-100 dark:border-white/10">
              <h3 className="font-bold text-sm mb-3">Conversation ({(ticket.replies || []).length})</h3>
              {(ticket.replies || []).length === 0 ? (
                <div className="text-sm text-ink-500 italic">No replies yet. Our team will respond within 24 hours.</div>
              ) : (
                <ol className="space-y-3">
                  {ticket.replies.map((r, i) => {
                    const fromUs = r.who !== 'Customer';
                    return (
                      <li key={i} className={`flex ${fromUs ? '' : 'justify-end'}`}>
                        <div className={`max-w-[80%] rounded-2xl p-3 ${fromUs ? 'bg-brand-50 dark:bg-brand-900/20' : 'bg-ink-100 dark:bg-white/5'}`}>
                          <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
                            {r.who} - {r.date}
                          </div>
                          <p className="mt-1 text-sm text-ink-700 dark:text-ink-200 whitespace-pre-line">{r.text}</p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>

            {/* Contact options */}
            {ticket.status !== 'closed' && (
              <div className="px-5 pb-5 flex flex-wrap gap-3">
                <a
                  href={`mailto:${BUSINESS.email}?subject=${encodeURIComponent(`Ticket ${ticket.id}`)}`}
                  className="btn-primary text-sm"
                >
                  <Mail size={14} /> Email support
                </a>
                <Link to="/contact" className="btn-ghost text-sm">Send a message</Link>
              </div>
            )}
          </article>
        )}
      </div>
    </>
  );
}
