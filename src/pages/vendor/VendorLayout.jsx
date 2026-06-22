import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LayoutDashboard, Package, ShoppingBag, FileText, LogOut, Store, Menu, X, Bell } from 'lucide-react';
import { getVendorToken, clearVendorToken, vendorMeApi } from '../../api/client';
import { tryRefreshFcmToken } from '../../utils/pushNotifications';
import Loader from '../../components/ui/Loader';

export default function VendorLayout() {
  const nav = useNavigate();
  const [vendor, setVendor] = useState(null);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getVendorToken()) {
      nav('/vendor/login', { replace: true });
      return;
    }
    setReady(false);
    vendorMeApi()
      .then((d) => { setVendor(d.vendor); setReady(true); tryRefreshFcmToken('vendor'); })
      .catch((e) => {
        if (e.status === 401) {
          clearVendorToken();
          nav('/vendor/login', { replace: true });
        } else {
          setReady(true);
        }
      });
  }, [nav]);

  const logout = () => {
    clearVendorToken();
    toast.success('Signed out');
    nav('/vendor/login', { replace: true });
  };

  const link = ({ isActive }) =>
    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ' +
    (isActive ? 'bg-brand-gradient text-white shadow-soft' : 'text-ink-700 dark:text-ink-200 hover:bg-ink-100 dark:hover:bg-white/5');

  if (!getVendorToken()) return null;
  if (!ready) return <Loader fullScreen />;

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-900 text-ink-900 dark:text-ink-100">
      <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-ink-100 dark:border-white/10 bg-white dark:bg-ink-800">
        <div className="flex items-center gap-2 font-extrabold"><Store size={18} className="text-brand-700" /> Vendor</div>
        <button type="button" onClick={() => setOpen((v) => !v)} className="btn-ghost !p-2">{open ? <X size={18} /> : <Menu size={18} />}</button>
      </header>

      <div className="lg:grid lg:grid-cols-[260px_1fr]">
        <aside className={(open ? 'block ' : 'hidden ') + 'lg:block border-r border-ink-100 dark:border-white/10 bg-white dark:bg-ink-800 p-4 space-y-4 lg:min-h-screen'}>
          <div className="hidden lg:flex items-center gap-2 px-2 py-3 font-extrabold text-lg">
            <Store size={20} className="text-brand-700" /> Vendor Portal
          </div>
          {vendor && (
            <div className="card p-3">
              <div className="text-xs text-ink-500">Signed in as</div>
              <div className="font-bold truncate">{vendor.name}</div>
              <div className="text-xs text-ink-500 truncate">{vendor.email}</div>
              <div className="text-xs text-brand-700 mt-1">Commission: price-slab rates (2%–10%)</div>
            </div>
          )}
          <nav className="space-y-1" onClick={() => setOpen(false)}>
            <NavLink to="/vendor" end className={link}><LayoutDashboard size={16} /> Dashboard</NavLink>
            <NavLink to="/vendor/products" className={link}><Package size={16} /> My Products</NavLink>
            <NavLink to="/vendor/orders" className={link}><ShoppingBag size={16} /> Orders</NavLink>
            <NavLink to="/vendor/notifications" className={link}><Bell size={16} /> Notifications</NavLink>
            <NavLink to="/vendor/listing-requests" className={link}><FileText size={16} /> Listing Requests</NavLink>
          </nav>
          <button type="button" onClick={logout} className="btn-outline w-full mt-3"><LogOut size={14} /> Sign out</button>
        </aside>
        <main className="p-4 lg:p-8 max-w-6xl w-full">
          <Outlet context={{ vendor }} />
        </main>
      </div>
    </div>
  );
}
