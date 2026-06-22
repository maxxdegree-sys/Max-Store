import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { Mail, Lock, Shield } from 'lucide-react';
import { setUser } from '../../store/authSlice';
import { isExecutive } from '../../utils/permissions';
import { apiLogin } from '../../api/client';
import Logo from '../../components/ui/Logo';

export default function AdminLogin() {
  const [email, setEmail] = useState('Alrafiqshopping56@gmail.com');
  const [pwd, setPwd] = useState('');
  const [busy, setBusy] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    if (!pwd) return toast.error('Please enter password');
    setBusy(true);
    try {
      const data = await apiLogin(email.trim(), pwd);
      const u = data.user;
      dispatch(setUser({
        uid: u.uid || u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        department: u.department,
        permissions: u.permissions,
        canImport: u.canImport ?? isExecutive(u.permissions || []),
        isAdmin: true
      }));
      toast.success(`Welcome ${u.name}`);
      navigate('/admin');
    } catch (err) {
      toast.error(err.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-brand-600 via-brand-500 to-brand-700 p-4">
      <form onSubmit={submit} className="w-full max-w-sm card p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Logo className="h-11 w-11" />
          <div className="text-xs uppercase tracking-widest font-bold text-brand-700">Admin Login</div>
        </div>
        <div className="space-y-3">
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="username"
              className="input pl-9"
              placeholder="Admin email"
            />
          </div>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
            <input
              type="password"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              autoComplete="current-password"
              className="input pl-9"
              placeholder="Password"
            />
          </div>
        </div>
        <button disabled={busy} className="btn-primary mt-5 w-full !py-3">
          <Shield size={16} /> {busy ? 'Signing in...' : 'Secure Sign-in'}
        </button>
        <p className="mt-4 text-[11px] text-ink-500 text-center leading-relaxed">
          Restricted area. Default executive: Alrafiqshopping56@gmail.com / alrafiq123
        </p>
        <p className="mt-2 text-xs text-center text-ink-500">
          <Link to="/" className="text-brand-700 font-semibold hover:underline">Storefront</Link>
          {' · '}
          <Link to="/vendor/login" className="text-brand-700 font-semibold hover:underline">Vendor login</Link>
        </p>
      </form>
    </div>
  );
}
