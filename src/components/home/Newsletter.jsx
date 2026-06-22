import { useState } from 'react';
import { Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { newsletterSubscribeApi } from '../../api/client';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (!email.includes('@')) return toast.error('Please enter a valid email.');
    setBusy(true);
    try {
      await newsletterSubscribeApi(email);
      toast.success('Thanks for subscribing! 🎉');
      setEmail('');
    } catch (err) {
      toast.error(err.message || 'Could not subscribe. Please try again.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="container-px py-12 sm:py-16">
      <div className="relative overflow-hidden rounded-3xl bg-brand-gradient text-white p-8 sm:p-12">
        <div className="absolute inset-0 bg-hero-radial opacity-30" />
        <div className="relative grid lg:grid-cols-2 items-center gap-8">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest opacity-80">Stay in the loop</div>
            <h3 className="text-2xl sm:text-3xl font-extrabold mt-2 max-w-md text-balance">
              Get exclusive deals delivered to your inbox
            </h3>
            <p className="mt-2 text-white/90 text-sm max-w-md">
              Be the first to know about flash sales, new arrivals and member-only offers from Maxx.
            </p>
          </div>
          <form onSubmit={submit} className="relative">
            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-500" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full rounded-2xl pl-11 pr-32 py-4 text-ink-900 focus:outline-none shadow-soft"
            />
            <button disabled={busy} className="absolute right-1.5 top-1/2 -translate-y-1/2 btn-primary !py-3 !px-6">
              {busy ? 'Subscribing…' : 'Subscribe'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
