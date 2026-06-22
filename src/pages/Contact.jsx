import { useState } from 'react';
import toast from 'react-hot-toast';
import { Mail, Clock, Send } from 'lucide-react';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import SEO from '../components/seo/SEO';
import { complaintSubmitApi } from '../api/client';
import { BUSINESS } from '../utils/format';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (!form.name || !form.email || !form.message) return toast.error('Please fill required fields');
    setBusy(true);
    try {
      await complaintSubmitApi({
        name: form.name,
        email: form.email,
        kind: 'general',
        subject: form.subject || 'Contact form enquiry',
        message: form.message
      });
      toast.success('Thanks! We will reply within 24 hours.');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      toast.error(err.message || 'Could not send message. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <SEO title="Contact Us" />
      <Breadcrumbs items={[{ label: 'Contact Us' }]} />
      <div className="container-px pb-14 grid lg:grid-cols-[1fr_1.2fr] gap-8 items-start pt-4">
        <div className="space-y-4">
          <h1 className="text-3xl font-extrabold">Let&apos;s talk</h1>
          <p className="text-ink-500">Have a question about an order, return, or wholesale enquiry? Our team replies fast.</p>
          {[
            { i: Mail,   t: 'Email us', d: BUSINESS.email, href: `mailto:${BUSINESS.email}` },
            { i: Clock,  t: 'Hours',    d: 'Mon - Sun, 10:00 AM to 10:00 PM' }
          ].map((c) => (
            <div key={c.t} className="card p-4 flex items-start gap-3">
              <span className="grid place-items-center w-10 h-10 rounded-xl bg-brand-50 text-brand-700"><c.i size={18} /></span>
              <div>
                <div className="font-semibold">{c.t}</div>
                {c.href ? (
                  <a href={c.href} className="text-sm text-brand-700 hover:underline">{c.d}</a>
                ) : (
                  <div className="text-sm text-ink-500">{c.d}</div>
                )}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={submit} className="card p-6 space-y-4">
          <h2 className="font-bold text-lg">Send us a message</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="text-sm"><div className="font-semibold mb-1">Name *</div><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <label className="text-sm"><div className="font-semibold mb-1">Email *</div><input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          </div>
          <label className="text-sm block"><div className="font-semibold mb-1">Subject</div><input className="input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></label>
          <label className="text-sm block"><div className="font-semibold mb-1">Message *</div><textarea rows={5} className="input" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></label>
          <button disabled={busy} className="btn-primary !py-3"><Send size={16} /> {busy ? 'Sending…' : 'Send Message'}</button>
        </form>
      </div>
    </>
  );
}
