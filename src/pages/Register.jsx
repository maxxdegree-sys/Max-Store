import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { Mail, Lock, User, Phone, Eye, EyeOff } from 'lucide-react';
import { setUser } from '../store/authSlice';
import { accountRegisterApi } from '../api/client';
import SEO from '../components/seo/SEO';
import Logo from '../components/ui/Logo';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', agree: true });
  const [showPwd, setShowPwd] = useState(false);
  const [busy, setBusy] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const register = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (!form.name || !form.email || !form.phone || !form.password) return toast.error('Please complete all fields');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    if (!form.agree) return toast.error('Accept terms to continue');
    setBusy(true);
    try {
      const data = await accountRegisterApi({ name: form.name, email: form.email, phone: form.phone, password: form.password });
      dispatch(setUser(data.user));
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Could not create account');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <SEO title="Create Account" />
      <div className="min-h-[80vh] container-px py-8 grid lg:grid-cols-2 gap-8 items-center">
        <div className="hidden lg:block relative rounded-3xl overflow-hidden bg-brand-gradient text-white p-12 h-full">
          <div className="absolute inset-0 bg-hero-radial opacity-30" />
          <div className="relative">
            <Logo className="h-14 w-14" />
            <h2 className="mt-6 text-4xl font-extrabold leading-tight max-w-md text-balance">
              Join the Maxx family
            </h2>
            <p className="mt-4 max-w-md text-white/90">
              Get an extra 10% off your first order with code <span className="font-bold">WELCOME10</span>.
            </p>
            <ul className="mt-6 space-y-2 text-sm">
              <li>✓ Exclusive flash sale alerts</li>
              <li>✓ One-click reorder</li>
              <li>✓ Priority email support</li>
            </ul>
          </div>
        </div>

        <div className="max-w-md w-full mx-auto card p-6 sm:p-8">
          <Link to="/" className="lg:hidden flex items-center gap-2 mb-5">
            <Logo className="h-9 w-9" />
          </Link>
          <h1 className="text-2xl font-extrabold">Create your account</h1>
          <p className="text-sm text-ink-500 mt-1">
            Already have one? <Link to="/login" className="text-brand-700 font-semibold">Sign in</Link>
          </p>

          <form onSubmit={register} className="space-y-3 mt-6">
            <InputIcon icon={User}  value={form.name}     onChange={update('name')}     placeholder="Full Name" />
            <InputIcon icon={Mail}  value={form.email}    onChange={update('email')}    placeholder="Email address" type="email" />
            <InputIcon icon={Phone} value={form.phone}    onChange={update('phone')}    placeholder="03XX-XXXXXXX" type="tel" />
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
              <input type={showPwd ? 'text' : 'password'} value={form.password} onChange={update('password')} placeholder="Create password (min 6 chars)" className="input pl-9 pr-9" />
              <button type="button" onClick={() => setShowPwd((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-ink-500">
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <label className="flex items-start gap-2 text-xs text-ink-500">
              <input type="checkbox" checked={form.agree} onChange={(e) => setForm((f) => ({ ...f, agree: e.target.checked }))} className="accent-brand-600 mt-1" />
              <span>I agree to the <Link to="/terms" className="text-brand-700">Terms</Link> and <Link to="/privacy-policy" className="text-brand-700">Privacy Policy</Link>.</span>
            </label>
            <button disabled={busy} className="btn-primary w-full !py-3">{busy ? 'Creating account…' : 'Create Account'}</button>
          </form>
        </div>
      </div>
    </>
  );
}

function InputIcon({ icon: Icon, ...rest }) {
  return (
    <div className="relative">
      <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
      <input className="input pl-9" {...rest} />
    </div>
  );
}
