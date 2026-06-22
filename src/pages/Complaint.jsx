import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  AlertTriangle, CheckCircle2, Mail, Copy, Send, Shield
} from 'lucide-react';
import { COMPLAINT_KINDS } from '../data/complaints';
import { notifyNewTicket } from '../utils/notify';
import { BUSINESS } from '../utils/format';
import { complaintSubmitApi } from '../api/client';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import SEO from '../components/seo/SEO';

export default function Complaint() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', city: '',
    orderId: '', productId: '',
    kind: 'product-issue', subject: '', message: ''
  });
  const [submittedTicket, setSubmittedTicket] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (!form.name.trim())    return toast.error('Please enter your name');
    if (!form.phone.trim())   return toast.error('Please enter your phone');
    if (!form.subject.trim()) return toast.error('Please enter a subject');
    if (form.message.trim().length < 15)
      return toast.error('Please describe your issue (at least 15 characters)');

    setBusy(true);
    try {
      const data = await complaintSubmitApi(form);
      const ticket = { ...form, id: data.id };
      notifyNewTicket(ticket);
      setSubmittedTicket(ticket);
      toast.success(`Ticket ${data.id} created`);
    } catch (err) {
      toast.error(err.message || 'Could not submit complaint. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  // ──────── SUCCESS VIEW ────────
  if (submittedTicket) {
    return (
      <>
        <SEO title="Complaint Received" />
        <Breadcrumbs items={[{ to: '/contact', label: 'Help' }, { label: 'Complaint Received' }]} />
        <div className="container-px py-10 max-w-2xl mx-auto">
          <div className="card p-8 text-center">
            <CheckCircle2 size={56} className="mx-auto text-brand-500" />
            <h1 className="text-2xl font-extrabold mt-3">Your complaint has been registered</h1>
            <p className="text-ink-500 mt-2">
              We have logged your ticket and our team will respond within 24 hours.
            </p>

            <div className="mt-6 rounded-xl bg-brand-50 dark:bg-brand-900/20 p-4 text-left">
              <div className="text-xs font-bold uppercase tracking-widest text-brand-700">Your ticket ID</div>
              <div className="mt-1 flex items-center justify-between gap-2">
                <code className="font-mono font-extrabold text-xl">{submittedTicket.id}</code>
                <button
                  onClick={() => { navigator.clipboard?.writeText(submittedTicket.id); toast.success('Copied'); }}
                  className="btn-ghost !p-2"
                  title="Copy ID"
                >
                  <Copy size={14} />
                </button>
              </div>
              <div className="text-xs text-ink-500 mt-2">
                Save this ID. You will use it to track and reply to this ticket.
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 mt-6">
              <Link to={`/track-ticket?id=${submittedTicket.id}`} className="btn-primary">
                Track this ticket
              </Link>
              <a
                href={`mailto:${BUSINESS.email}?subject=${encodeURIComponent(`Complaint ticket ${submittedTicket.id}`)}`}
                className="btn-outline"
              >
                <Mail size={16} /> Email support
              </a>
            </div>

            <p className="text-xs text-ink-500 mt-6">
              We have also opened your mail app with a copy of this ticket - keep that email for your records.
            </p>
          </div>
        </div>
      </>
    );
  }

  // ──────── FORM VIEW ────────
  return (
    <>
      <SEO
        title="File a Complaint"
        description="Register a complaint or service request. We will respond within 24 hours."
      />
      <Breadcrumbs items={[{ to: '/contact', label: 'Help' }, { label: 'File a Complaint' }]} />

      <div className="container-px py-6 pb-14 grid lg:grid-cols-[1fr_320px] gap-6 items-start">
        <form onSubmit={submit} className="card p-6 space-y-5">
          <header>
            <h1 className="text-2xl font-extrabold flex items-center gap-2">
              <AlertTriangle className="text-amber-500" /> File a Complaint
            </h1>
            <p className="text-sm text-ink-500 mt-1">
              Tell us what went wrong. We will generate a ticket ID and reply within 24 hours.
            </p>
          </header>

          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Your Name *"   value={form.name}    onChange={set('name')} />
            <Field label="Phone *"       value={form.phone}   onChange={set('phone')}    type="tel"   placeholder="03XX-XXXXXXX" />
            <Field label="Email"         value={form.email}   onChange={set('email')}    type="email" placeholder="for ticket updates" />
            <Field label="City"          value={form.city}    onChange={set('city')} />
            <Field label="Order Number"  value={form.orderId} onChange={set('orderId')}  placeholder="e.g. ARS-1024" />
            <Field label="Product ID"    value={form.productId} onChange={set('productId')} placeholder="optional" />
          </div>

          <label className="text-sm block">
            <div className="font-semibold mb-1">What is the issue? *</div>
            <select className="input" value={form.kind} onChange={set('kind')}>
              {COMPLAINT_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
            </select>
          </label>

          <Field label="Subject *" value={form.subject} onChange={set('subject')} placeholder="One line summary" maxLength={120} />

          <label className="text-sm block">
            <div className="font-semibold mb-1">Describe what happened *</div>
            <textarea
              rows={6}
              className="input"
              value={form.message}
              onChange={set('message')}
              placeholder="What happened, when, and what you expected. Add as much detail as possible - it helps us resolve faster."
              maxLength={2000}
            />
            <div className="text-[11px] text-ink-500 mt-1 text-right">{form.message.length} / 2000</div>
          </label>

          <button type="submit" disabled={busy} className="btn-primary w-full !py-3">
            <Send size={16} /> {busy ? 'Submitting…' : 'Submit Complaint'}
          </button>
          <p className="text-[11px] text-ink-500 text-center">
            By submitting you agree to be contacted by email about this ticket.
          </p>
        </form>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <div className="card p-5">
            <h3 className="font-bold flex items-center gap-2"><Shield size={16} className="text-brand-700" /> What happens next</h3>
            <ol className="mt-3 space-y-2 text-sm">
              <Step n="1" t="We generate a ticket ID" />
              <Step n="2" t="Email confirmation is sent to you" />
              <Step n="3" t="Our team responds within 24 hours" />
              <Step n="4" t="You can reply, track or close anytime" />
            </ol>
          </div>

          <div className="card p-5">
            <h3 className="font-bold">Need faster help?</h3>
            <a href={`mailto:${BUSINESS.email}`} className="btn-primary !py-2.5 mt-3 w-full text-sm">
              <Mail size={14} /> {BUSINESS.email}
            </a>
          </div>

          <div className="rounded-2xl bg-brand-50 dark:bg-brand-900/20 p-4 text-xs text-ink-700 dark:text-ink-200">
            <b className="text-brand-700">Already have a ticket?</b>
            <p className="mt-1">Track its status or add a reply.</p>
            <Link to="/track-ticket" className="btn-outline !py-1.5 !px-3 mt-2 text-xs">Track a ticket</Link>
          </div>
        </aside>
      </div>
    </>
  );
}

function Field({ label, className = '', ...props }) {
  return (
    <label className={`text-sm block ${className}`}>
      <div className="font-semibold mb-1 text-ink-700 dark:text-ink-200">{label}</div>
      <input className="input" {...props} />
    </label>
  );
}

function Step({ n, t }) {
  return (
    <li className="flex items-start gap-2">
      <span className="grid place-items-center w-5 h-5 rounded-full bg-brand-500 text-white text-[10px] font-bold shrink-0 mt-0.5">{n}</span>
      <span className="text-ink-700 dark:text-ink-200">{t}</span>
    </li>
  );
}
