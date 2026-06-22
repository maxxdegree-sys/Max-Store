import { useEffect, useState } from 'react';
import { NavLink, Route, Routes, useNavigate, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { LayoutDashboard, ShoppingBag, Heart, MapPin, Bell, LogOut, Lock, User, Plus, Pencil, Trash2, Star, Check, X } from 'lucide-react';
import { logout, logoutCustomer, selectUser, setUser } from '../store/authSlice';
import { selectWishlistCount } from '../store/wishlistSlice';
import {
  accountMeApi, accountUpdateApi, accountPasswordApi, clearCustomerToken, getCustomerToken,
  addressCreateApi, addressUpdateApi, addressDeleteApi,
  customerNotificationsApi, customerMarkNotificationReadApi, customerMarkAllNotificationsReadApi
} from '../api/client';
import { enableAppPush, pushForNewNotifications, tryRefreshFcmToken } from '../utils/pushNotifications';
import { formatPKR } from '../utils/format';
import { statusColor } from '../utils/orderStatus';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import SEO from '../components/seo/SEO';
import Loader from '../components/ui/Loader';

export default function Dashboard() {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [ready, setReady] = useState(() => !getCustomerToken());

  const load = () => accountMeApi()
    .then((d) => {
      if (d?.user) dispatch(setUser(d.user));
      setOrders(d?.orders || []);
      setAddresses(d?.addresses || []);
    })
    .catch(() => {
      clearCustomerToken();
      dispatch(logoutCustomer());
      setOrders([]);
      setAddresses([]);
    })
    .finally(() => setReady(true));

  useEffect(() => {
    if (!getCustomerToken()) {
      setReady(true);
      return;
    }
    setReady(false);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  if (!getCustomerToken()) return <Navigate to="/login" replace state={{ from: 'dashboard' }} />;
  if (!ready) return <Loader fullScreen />;

  const links = [
    { to: '',          icon: LayoutDashboard, label: 'Overview', end: true },
    { to: 'orders',    icon: ShoppingBag,     label: 'My Orders' },
    { to: 'profile',   icon: User,            label: 'Profile' },
    { to: 'addresses', icon: MapPin,          label: 'Addresses' },
    { to: 'wishlist',  icon: Heart,           label: 'Wishlist' },
    { to: 'notifications', icon: Bell,        label: 'Notifications' },
    { to: 'security',  icon: Lock,            label: 'Security' }
  ];

  const handleLogout = () => {
    dispatch(logoutCustomer());
    clearCustomerToken();
    setOrders([]);
    setAddresses([]);
    navigate('/');
  };

  return (
    <>
      <SEO title="My Account" />
      <Breadcrumbs items={[{ label: 'My Account' }]} />
      <div className="container-px pb-12 grid lg:grid-cols-[260px_1fr] gap-6">
        <aside className="card p-4 lg:sticky lg:top-24 self-start">
          <div className="flex items-center gap-3 p-2">
            <div className="grid place-items-center w-11 h-11 rounded-full bg-brand-gradient text-white font-bold">
              {(user?.name?.[0] || 'A').toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="font-bold truncate">{user?.name || 'Guest'}</div>
              <div className="text-xs text-ink-500 truncate">{user?.email || 'guest@maxx.example'}</div>
            </div>
          </div>
          <nav className="mt-3 space-y-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                end={l.end}
                to={l.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-brand-50 text-brand-700' : 'hover:bg-ink-100 dark:hover:bg-white/5'}`
                }
              >
                <l.icon size={16} /> {l.label}
              </NavLink>
            ))}
            <button onClick={handleLogout} className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
              <LogOut size={16} /> Logout
            </button>
          </nav>
        </aside>

        <section>
          <Routes>
            <Route index element={<Overview orders={orders} addresses={addresses} />} />
            <Route path="orders" element={<Orders orders={orders} />} />
            <Route path="profile" element={<Profile user={user} />} />
            <Route path="addresses" element={<Addresses addresses={addresses} reload={load} />} />
            <Route path="wishlist" element={<WishlistTab />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="security" element={<Security />} />
          </Routes>
        </section>
      </div>
    </>
  );
}

function Overview({ orders, addresses = [] }) {
  const wishCount = useSelector(selectWishlistCount);
  const inTransit = orders.filter((o) => (o.deliveryStatus || '').toLowerCase() === 'in transit').length;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">Welcome back 👋</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { l: 'Total Orders', v: String(orders.length) },
          { l: 'In Transit',   v: String(inTransit) },
          { l: 'Saved Addresses', v: String(addresses.length) },
          { l: 'Wishlist Items', v: String(wishCount) }
        ].map((s) => (
          <div key={s.l} className="card p-5">
            <div className="text-xs uppercase tracking-wider text-ink-500 font-bold">{s.l}</div>
            <div className="text-3xl font-extrabold mt-1">{s.v}</div>
          </div>
        ))}
      </div>
      <RecentOrdersTable orders={orders} />
    </div>
  );
}

function Orders({ orders }) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">My Orders</h1>
      <RecentOrdersTable orders={orders} />
    </div>
  );
}

function RecentOrdersTable({ orders }) {
  const navigate = useNavigate();
  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3 border-b border-ink-100 dark:border-white/10 font-bold">Recent Orders</div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-ink-100/60 dark:bg-white/5 text-left">
            <tr>
              {['Order #', 'Date', 'Items', 'Total', 'Status', ''].map((h) => <th key={h} className="px-4 py-3 font-semibold text-ink-700 dark:text-ink-100">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-ink-500">You haven&apos;t placed any orders yet.</td></tr>
            ) : orders.map((o) => (
              <tr key={o.id} className="border-t border-ink-100 dark:border-white/10">
                <td className="px-4 py-3 font-mono">{o.id}</td>
                <td className="px-4 py-3 text-ink-500">{o.date}</td>
                <td className="px-4 py-3">{o.items}</td>
                <td className="px-4 py-3 font-semibold">{formatPKR(o.total)}</td>
                <td className="px-4 py-3"><span className={`badge ${statusColor[o.deliveryStatus] || 'bg-ink-100 text-ink-700'} ring-1`}>{o.deliveryStatus}</span></td>
                <td className="px-4 py-3 text-right"><button onClick={() => navigate(`/order-tracking?id=${encodeURIComponent(o.id)}`)} className="text-brand-700 text-xs font-semibold">Track</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Profile({ user }) {
  const dispatch = useDispatch();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', city: user?.city || '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setForm({ name: user?.name || '', phone: user?.phone || '', city: user?.city || '' });
  }, [user]);

  const upd = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (!form.name.trim()) return toast.error('Name cannot be empty');
    setBusy(true);
    try {
      const d = await accountUpdateApi({ name: form.name, phone: form.phone, city: form.city });
      if (d?.user) dispatch(setUser(d.user));
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.message || 'Could not update profile');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="card p-5 space-y-4 max-w-xl">
      <h1 className="text-2xl font-extrabold">My Profile</h1>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block text-sm"><div className="font-semibold mb-1">Full name</div><input value={form.name} onChange={upd('name')} className="input" /></label>
        <label className="block text-sm"><div className="font-semibold mb-1">Phone</div><input value={form.phone} onChange={upd('phone')} className="input" placeholder="03XX-XXXXXXX" /></label>
        <label className="block text-sm"><div className="font-semibold mb-1">City</div><input value={form.city} onChange={upd('city')} className="input" /></label>
        <label className="block text-sm"><div className="font-semibold mb-1">Email</div><input value={user?.email || ''} disabled className="input opacity-60 cursor-not-allowed" /><div className="text-[11px] text-ink-500 mt-1">Email can&apos;t be changed — it&apos;s your sign-in ID.</div></label>
      </div>
      <button disabled={busy} className="btn-primary">{busy ? 'Saving…' : 'Save Changes'}</button>
    </form>
  );
}

const EMPTY_ADDRESS = { label: 'Home', name: '', phone: '', address: '', city: '', province: 'Punjab', isDefault: false };

function Addresses({ addresses = [], reload }) {
  const [editing, setEditing] = useState(null); // address id, or 'new', or null
  const [form, setForm] = useState(EMPTY_ADDRESS);
  const [busy, setBusy] = useState(false);

  const startAdd = () => { setForm(EMPTY_ADDRESS); setEditing('new'); };
  const startEdit = (a) => { setForm({ label: a.label, name: a.name, phone: a.phone, address: a.address, city: a.city, province: a.province, isDefault: a.isDefault }); setEditing(a.id); };
  const cancel = () => { setEditing(null); setForm(EMPTY_ADDRESS); };
  const upd = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (!form.address.trim()) return toast.error('Address is required');
    setBusy(true);
    try {
      if (editing === 'new') await addressCreateApi(form);
      else await addressUpdateApi(editing, form);
      toast.success('Address saved');
      cancel();
      await reload();
    } catch (err) {
      toast.error(err.message || 'Could not save address');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      await addressDeleteApi(id);
      toast.success('Address removed');
      await reload();
    } catch (err) {
      toast.error(err.message || 'Could not delete address');
    }
  };

  const makeDefault = async (id) => {
    try { await addressUpdateApi(id, { isDefault: true }); await reload(); }
    catch (err) { toast.error(err.message || 'Could not update'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Saved Addresses</h1>
        {editing === null && (
          <button onClick={startAdd} className="btn-primary !py-2 text-sm"><Plus size={16} /> Add Address</button>
        )}
      </div>

      {editing !== null && (
        <form onSubmit={save} className="card p-5 space-y-3">
          <div className="font-bold">{editing === 'new' ? 'Add a new address' : 'Edit address'}</div>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block text-sm"><div className="font-semibold mb-1">Label</div><input value={form.label} onChange={upd('label')} className="input" placeholder="Home, Office…" /></label>
            <label className="block text-sm"><div className="font-semibold mb-1">Recipient name</div><input value={form.name} onChange={upd('name')} className="input" /></label>
            <label className="block text-sm"><div className="font-semibold mb-1">Phone</div><input value={form.phone} onChange={upd('phone')} className="input" placeholder="03XX-XXXXXXX" /></label>
            <label className="block text-sm"><div className="font-semibold mb-1">City</div><input value={form.city} onChange={upd('city')} className="input" /></label>
            <label className="block text-sm"><div className="font-semibold mb-1">Province</div><input value={form.province} onChange={upd('province')} className="input" /></label>
            <label className="block text-sm sm:col-span-2"><div className="font-semibold mb-1">Address *</div><input value={form.address} onChange={upd('address')} className="input" placeholder="House #, street, area" /></label>
          </div>
          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" className="accent-brand-600" checked={form.isDefault} onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))} /> Set as default delivery address</label>
          <div className="flex gap-2">
            <button disabled={busy} className="btn-primary !py-2 text-sm">{busy ? 'Saving…' : 'Save Address'}</button>
            <button type="button" onClick={cancel} className="btn-ghost !py-2 text-sm"><X size={16} /> Cancel</button>
          </div>
        </form>
      )}

      {addresses.length === 0 && editing === null ? (
        <div className="card p-8 text-center text-ink-500">
          <MapPin size={36} className="mx-auto opacity-40 mb-2" />
          <p className="text-sm">No saved addresses yet. Add one for faster checkout.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {addresses.map((a) => (
            <div key={a.id} className="card p-5">
              <div className="flex items-center justify-between">
                <div className="font-bold flex items-center gap-2"><MapPin size={16} className="text-brand-700" /> {a.label || 'Address'}</div>
                {a.isDefault && <span className="badge bg-brand-50 text-brand-700 ring-1 ring-brand-200 inline-flex items-center gap-1"><Check size={12} /> Default</span>}
              </div>
              {a.name && <p className="text-sm font-medium mt-2">{a.name}</p>}
              <p className="text-sm text-ink-500 mt-0.5">{[a.address, a.city, a.province].filter(Boolean).join(', ')}</p>
              {a.phone && <p className="text-sm text-ink-500 mt-0.5">{a.phone}</p>}
              <div className="flex items-center gap-3 mt-3 text-xs">
                {!a.isDefault && <button onClick={() => makeDefault(a.id)} className="text-brand-700 font-semibold inline-flex items-center gap-1"><Star size={13} /> Make default</button>}
                <button onClick={() => startEdit(a)} className="text-ink-600 font-semibold inline-flex items-center gap-1"><Pencil size={13} /> Edit</button>
                <button onClick={() => remove(a.id)} className="text-rose-600 font-semibold inline-flex items-center gap-1"><Trash2 size={13} /> Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WishlistTab() {
  return (
    <div className="card p-6 text-center">
      <Heart className="mx-auto text-rose-500" />
      <p className="mt-3 text-sm">Visit your <a href="/wishlist" className="text-brand-700 font-semibold">Wishlist</a> to see saved items.</p>
    </div>
  );
}

function Notifications() {
  const [list, setList] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pushOn, setPushOn] = useState(() => typeof Notification !== 'undefined' && Notification.permission === 'granted');

  const load = () => customerNotificationsApi()
    .then((d) => {
      const prev = new Set(list.map((n) => n.id));
      pushForNewNotifications(d?.notifications || [], prev);
      setList(d?.notifications || []);
      setUnread(d?.unread ?? 0);
    })
    .catch(() => setList([]))
    .finally(() => setLoading(false));

  useEffect(() => {
    load();
    tryRefreshFcmToken('customer');
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, []);

  const markRead = async (id) => {
    await customerMarkNotificationReadApi(id);
    setList((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnread((u) => Math.max(0, u - 1));
  };

  const enablePush = async () => {
    const { status, reason } = await enableAppPush({ userType: 'customer' });
    setPushOn(status === 'granted');
    if (status === 'granted') toast.success('Push notifications enabled (Firebase FCM)');
    else if (status === 'denied') toast.error('Notifications blocked in browser settings');
    else if (status === 'unsupported') toast.error('Push not supported in this browser');
    else toast.error(reason ? `Could not enable push: ${reason}` : 'Could not enable push notifications');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-extrabold">Notifications {unread > 0 && <span className="badge bg-brand-50 text-brand-700 ml-2">{unread} new</span>}</h1>
        <div className="flex gap-2">
          {!pushOn && (
            <button type="button" onClick={enablePush} className="btn-outline !py-2 !px-3 text-xs">Enable push</button>
          )}
          {unread > 0 && (
            <button type="button" onClick={() => customerMarkAllNotificationsReadApi().then(load)} className="btn-ghost !py-2 !px-3 text-xs">Mark all read</button>
          )}
        </div>
      </div>
      {loading ? <div className="text-ink-500 text-sm">Loading...</div> : list.length === 0 ? (
        <div className="card p-8 text-center text-ink-500">
          <Bell size={36} className="mx-auto opacity-40 mb-2" />
          <p className="text-sm">No notifications yet. Order updates will appear here.</p>
        </div>
      ) : (
        <div className="card divide-y divide-ink-100 dark:divide-white/10">
          {list.map((n) => (
            <div key={n.id} className={`p-4 flex items-start gap-3 ${!n.read ? 'bg-brand-50/50 dark:bg-brand-900/10' : ''}`}>
              <span className="grid place-items-center w-9 h-9 rounded-full bg-brand-50 text-brand-700"><Bell size={16} /></span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{n.title}</div>
                {n.body && <div className="text-xs text-ink-500 mt-0.5">{n.body}</div>}
                <div className="text-xs text-ink-400 mt-1">{(n.createdAt || '').slice(0, 16).replace('T', ' ')}</div>
                {n.link && <a href={n.link} className="text-xs text-brand-700 font-semibold mt-1 inline-block">View →</a>}
              </div>
              {!n.read && <button type="button" onClick={() => markRead(n.id)} className="text-xs text-brand-700 font-semibold shrink-0">Mark read</button>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Security() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [busy, setBusy] = useState(false);

  const update = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (next.length < 6) return toast.error('New password must be at least 6 characters');
    setBusy(true);
    try {
      await accountPasswordApi({ currentPassword: current, newPassword: next });
      toast.success('Password updated');
      setCurrent(''); setNext('');
    } catch (err) {
      toast.error(err.message || 'Could not update password');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={update} className="card p-5 space-y-4">
      <h1 className="text-2xl font-extrabold">Account Security</h1>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block text-sm"><div className="font-semibold mb-1">Current password</div><input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} className="input" /></label>
        <label className="block text-sm"><div className="font-semibold mb-1">New password</div><input type="password" value={next} onChange={(e) => setNext(e.target.value)} className="input" /></label>
      </div>
      <button disabled={busy} className="btn-primary">{busy ? 'Updating…' : 'Update Password'}</button>
    </form>
  );
}
