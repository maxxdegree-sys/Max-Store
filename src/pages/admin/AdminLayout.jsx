import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import {
  LayoutDashboard, Boxes, ShoppingCart, Users, Image as ImageIcon,
  Ticket, Star, MessageSquare, Wallet, Download, FileText, Mail, UserCog, Activity, Bell, LogOut, Menu, X, Eye, Megaphone, Store
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { logoutAdmin, stopImpersonate, selectUser, selectPermissions, selectImpersonator, setUser } from '../../store/authSlice';
import { recordLogout } from '../../store/adminUsersSlice';
import { logActivity } from '../../store/activitySlice';
import { can } from '../../utils/permissions';
import { clearToken, endImpersonationToken, accountMeApi, getCustomerToken, complaintsListApi } from '../../api/client';
import Logo from '../../components/ui/Logo';

const nav = [
  { to: '/admin',            icon: LayoutDashboard, label: 'Dashboard',  perm: 'dashboard', end: true },
  { to: '/admin/products',   icon: Boxes,           label: 'Products',   perm: 'products' },
  { to: '/admin/orders',     icon: ShoppingCart,    label: 'Orders',     perm: 'orders' },
  { to: '/admin/customers',  icon: Users,           label: 'Customers',  perm: 'customers' },
  { to: '/admin/banners',    icon: ImageIcon,       label: 'Banners',    perm: 'banners' },
  { to: '/admin/content',    icon: Megaphone,       label: 'Site Content', perm: 'banners' },
  { to: '/admin/coupons',    icon: Ticket,          label: 'Coupons',    perm: 'coupons' },
  { to: '/admin/reviews',    icon: Star,            label: 'Reviews',    perm: 'reviews' },
  { to: '/admin/complaints', icon: MessageSquare,   label: 'Complaints', perm: 'complaints', badge: 'openComplaints' },
  { to: '/admin/accounts',   icon: Wallet,          label: 'Accounts',   perm: 'accounts' },
  { to: '/admin/commission', icon: Wallet,          label: 'Commission', perm: 'accounts' },
  { to: '/admin/exports',    icon: Download,        label: 'Exports',    perm: 'exports' },
  { to: '/admin/blog',       icon: FileText,        label: 'Blog & SEO', perm: 'blog' },
  { to: '/admin/email',      icon: Mail,            label: 'Email',      perm: 'email' },
  { to: '/admin/vendors',    icon: Store,           label: 'Vendors',    perm: 'vendors' },
  { to: '/admin/listing-requests', icon: FileText,  label: 'Listing Requests', perm: 'vendors' },
  { to: '/admin/team',       icon: UserCog,         label: 'Team',       perm: 'team' },
  { to: '/admin/activity',   icon: Activity,        label: 'Activity Log', perm: 'activity' }
];

function countOpenComplaints(complaints = []) {
  return complaints.filter((c) => c.status !== 'resolved' && c.status !== 'closed').length;
}

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const [openComplaints, setOpenComplaints] = useState(0);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const permissions = useSelector(selectPermissions);
  const impersonator = useSelector(selectImpersonator);

  const fetchOpenComplaints = useCallback(() => {
    if (!can(permissions, 'complaints')) return;
    complaintsListApi()
      .then((data) => setOpenComplaints(countOpenComplaints(data.complaints || [])))
      .catch(() => {});
  }, [permissions]);

  useEffect(() => {
    fetchOpenComplaints();
    const refresh = () => fetchOpenComplaints();
    window.addEventListener('maxx:complaints-changed', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.removeEventListener('maxx:complaints-changed', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [fetchOpenComplaints]);

  const exitImpersonation = () => {
    endImpersonationToken();
    dispatch(stopImpersonate());
    toast.success('Returned to your account');
    navigate('/admin');
  };

  const handleLogout = () => {
    endImpersonationToken();
    clearToken();
    if (user) {
      const at = new Date().toISOString().slice(0, 16).replace('T', ' ');
      dispatch(recordLogout({ email: user.email, at }));
      dispatch(logActivity({ userId: user.uid, userName: user.name, action: 'logout', detail: 'Logged out' }));
    }
    dispatch(logoutAdmin());
    if (getCustomerToken()) {
      accountMeApi()
        .then((d) => { if (d?.user) dispatch(setUser(d.user)); })
        .catch(() => { /* customer token invalid — ignore */ });
    }
    navigate('/admin/login');
  };

  // Only show nav items this admin is permitted to see.
  const visibleNav = nav.filter((n) => can(permissions, n.perm));

  return (
    <div className="min-h-screen bg-ink-100 dark:bg-ink-900 flex">
      <aside className={`fixed lg:static z-40 inset-y-0 left-0 w-64 bg-white dark:bg-ink-900 border-r border-ink-100 dark:border-white/10 transform transition-transform ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-16 flex items-center justify-between px-5 border-b border-ink-100 dark:border-white/10">
          <div className="flex items-center gap-2">
            <Logo className="h-8 w-8" />
            <div className="text-[10px] uppercase tracking-widest text-ink-500">Admin Panel</div>
          </div>
          <button onClick={() => setOpen(false)} className="lg:hidden btn-ghost !p-2"><X /></button>
        </div>

        <nav className="p-3 space-y-1">
          {visibleNav.map((n) => {
            const showBadge = n.badge === 'openComplaints' && openComplaints > 0;
            return (
              <NavLink
                key={n.to} end={n.end} to={n.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${isActive ? 'bg-brand-gradient text-white shadow-glow' : 'hover:bg-ink-100 dark:hover:bg-white/5'}`
                }
              >
                <n.icon size={16} />
                <span className="flex-1">{n.label}</span>
                {showBadge && (
                  <span className="grid place-items-center min-w-[20px] h-5 px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                    {openComplaints}
                  </span>
                )}
              </NavLink>
            );
          })}
          <div className="pt-3 mt-3 border-t border-ink-100 dark:border-white/10">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"><LogOut size={16} /> Logout</button>
          </div>
        </nav>
      </aside>

      {open && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setOpen(false)} />}

      <div className="flex-1 min-w-0">
        {impersonator && (
          <div className="bg-amber-500 text-white text-sm px-4 py-2 flex items-center justify-between gap-3 flex-wrap">
            <span className="inline-flex items-center gap-2"><Eye size={15} /> Viewing as <b>{user?.name}</b> ({user?.role}) - you are signed in as {impersonator?.name}.</span>
            <button onClick={exitImpersonation} className="rounded-lg bg-white/20 hover:bg-white/30 px-3 py-1 font-semibold">Exit to my account</button>
          </div>
        )}
        <header className="sticky top-0 z-20 h-16 bg-white dark:bg-ink-900 border-b border-ink-100 dark:border-white/10 flex items-center gap-3 px-5">
          <button onClick={() => setOpen(true)} className="lg:hidden btn-ghost !p-2"><Menu /></button>
          <h1 className="font-bold">Admin Panel</h1>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden sm:block text-right leading-tight">
              <div className="text-xs font-bold">{user?.name || 'Admin'}</div>
              <div className="text-[10px] uppercase tracking-wider text-ink-500">{user?.role || ''}</div>
            </div>
            <button className="btn-ghost !p-2 relative">
              <Bell size={18} />
              {openComplaints > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full" />}
            </button>
            <div className="grid place-items-center w-9 h-9 rounded-full bg-brand-gradient text-white font-bold text-xs">
              {(user?.name || 'AR').split(' ').map((w) => w[0] || '').slice(0, 2).join('').toUpperCase()}
            </div>
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8 max-w-[1500px]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
