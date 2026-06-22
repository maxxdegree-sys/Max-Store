import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Store, LogIn } from 'lucide-react';
import { vendorLoginApi, getVendorToken } from '../../api/client';
import { tryRefreshFcmToken } from '../../utils/pushNotifications';

export default function VendorLogin() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (getVendorToken()) nav('/vendor', { replace: true }); }, [nav]);

  const submit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Email and password required');
    setBusy(true);
    try {
      const r = await vendorLoginApi(email.trim(), password);
      toast.success('Welcome, ' + (r?.vendor?.name || 'vendor'));
      tryRefreshFcmToken('vendor');
      nav('/vendor', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Login failed');
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-brand-50 to-white dark:from-ink-900 dark:to-ink-800 p-4">
      <form onSubmit={submit} className="w-full max-w-md card p-8 space-y-5">
        <div className="text-center space-y-2">
          <div className="inline-grid place-items-center w-14 h-14 rounded-2xl bg-brand-gradient text-white"><Store size={26} /></div>
          <h1 className="text-2xl font-extrabold">Vendor Portal</h1>
          <p className="text-sm text-ink-500">Supplier sign-in for Maxx.</p>
        </div>
        <label className="block text-sm">
          <div className="font-semibold mb-1">Email</div>
          <input className="input" type="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="samsung@vendor.maxx.pk" />
        </label>
        <label className="block text-sm">
          <div className="font-semibold mb-1">Password</div>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
        </label>
        <button disabled={busy} className="btn-primary w-full !py-3">
          {busy ? 'Signing in...' : (<><LogIn size={16} /> Sign in</>)}
        </button>
        <div className="text-xs text-ink-500 text-center">
          Not a vendor? <a className="text-brand-700 font-semibold" href="/login">Customer login</a> &middot; <a className="text-brand-700 font-semibold" href="/admin/login">Admin login</a>
        </div>
      </form>
    </div>
  );
}
