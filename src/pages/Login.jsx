import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { Mail, Lock, ShoppingBag, Eye, EyeOff } from 'lucide-react';
import { setUser } from '../store/authSlice';
import { accountLoginApi } from '../api/client';
import { tryRefreshFcmToken } from '../utils/pushNotifications';
import SEO from '../components/seo/SEO';
import Logo from '../components/ui/Logo';

export default function Login() {
  const [showPwd, setShowPwd] = useState(false);
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [busy, setBusy] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (!email || !pwd) return toast.error('Enter email and password');
    setBusy(true);
    try {
      const data = await accountLoginApi({ email, password: pwd });
      dispatch(setUser(data.user));
      toast.success('Welcome back!');
      tryRefreshFcmToken('customer');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Could not sign in');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <SEO title="Login" />
      <div className="min-h-[80vh] container-px py-8 grid lg:grid-cols-2 gap-8 items-center">
        <div className="hidden lg:block relative rounded-3xl overflow-hidden bg-brand-gradient text-white p-12 h-full">
          <div className="absolute inset-0 bg-hero-radial opacity-30" />
          <div className="relative">
            <Logo className="h-14 w-14" />
            <h2 className="mt-6 text-4xl font-extrabold leading-tight max-w-md text-balance">
              Welcome back to Maxx
            </h2>
            <p className="mt-4 max-w-md text-white/90">
              Sign in to track orders, save your favorites, and unlock member-only deals.
            </p>
            <ul className="mt-6 space-y-2 text-sm">
              <li>✓ Faster checkout</li>
              <li>✓ Order history & tracking</li>
              <li>✓ Personalized recommendations</li>
            </ul>
          </div>
        </div>

        <div className="max-w-md w-full mx-auto card p-6 sm:p-8">
          <Link to="/" className="lg:hidden flex items-center gap-2 mb-5">
            <Logo className="h-9 w-9" />
          </Link>
          <h1 className="text-2xl font-extrabold">Sign in to your account</h1>
          <p className="text-sm text-ink-500 mt-1">New here? <Link to="/register" className="text-brand-700 font-semibold">Create an account</Link></p>

          <form onSubmit={submit} className="space-y-3 mt-6">
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email address" className="input pl-9" />
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
              <input value={pwd} onChange={(e) => setPwd(e.target.value)} type={showPwd ? 'text' : 'password'} placeholder="Password" className="input pl-9 pr-9" />
              <button type="button" onClick={() => setShowPwd((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-ink-500">
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="inline-flex items-center gap-2"><input type="checkbox" className="accent-brand-600" /> Remember me</label>
              <Link to="/contact" className="text-brand-700">Forgot password?</Link>
            </div>
            <button disabled={busy} className="btn-primary w-full !py-3">{busy ? 'Signing in…' : 'Sign In'}</button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-ink-500">
            <span className="flex-1 h-px bg-ink-200" /> OR <span className="flex-1 h-px bg-ink-200" />
          </div>
          <button type="button" onClick={() => navigate('/')} className="btn-outline w-full !py-3"><ShoppingBag size={16} /> Continue as Guest</button>
        </div>
      </div>
    </>
  );
}
