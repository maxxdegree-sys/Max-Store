import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import { TrendingUp, ShoppingCart, Users, Boxes, ArrowUpRight, ArrowDownRight, Lock, Truck } from 'lucide-react';
import { formatPKR } from '../../utils/format';
import { selectPermissions } from '../../store/authSlice';
import { isExecutive } from '../../utils/permissions';
import { ordersListApi, customersListApi, productsListAdminApi } from '../../api/client';

const PIE_COLORS = ['#c41e1e', '#e62626', '#ff3131', '#ff5252', '#ff8a8a'];

const statusColor = {
  delivered:    'bg-brand-50 text-brand-700 ring-brand-200',
  'in-transit': 'bg-sky-50 text-sky-700 ring-sky-200',
  processing:   'bg-amber-50 text-amber-700 ring-amber-200',
  pending:      'bg-amber-50 text-amber-700 ring-amber-200',
  cancelled:    'bg-rose-50 text-rose-700 ring-rose-200'
};

// Order statuses are stored Title Case with spaces ('In Transit'); normalise
// to the lowercase-hyphen keys used above so counts and colours match.
const normStatus = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, '-');

export default function AdminDashboard() {
  const permissions = useSelector(selectPermissions);
  const exec = isExecutive(permissions);

  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    Promise.all([
      ordersListApi().catch(() => ({ orders: [] })),
      customersListApi().catch(() => ({ customers: [] })),
      productsListAdminApi().catch(() => ({ products: [] }))
    ]).then(([od, cd, pd]) => {
      setOrders(od.orders || []);
      setCustomers(cd.customers || []);
      setProducts(pd.products || []);
    });
  }, []);

  const now = Date.now();
  const MS_DAY = 86400000;

  // Last 7 days orders
  const recent7 = orders.filter((o) => now - new Date(o.createdAt).getTime() < 7 * MS_DAY);
  const prev7   = orders.filter((o) => {
    const age = now - new Date(o.createdAt).getTime();
    return age >= 7 * MS_DAY && age < 14 * MS_DAY;
  });

  const revenue7d  = recent7.reduce((s, o) => s + Number(o.total || o.orderTotal || 0), 0);
  const revPrev    = prev7.reduce((s, o) => s + Number(o.total || o.orderTotal || 0), 0);
  const revDelta   = revPrev ? (((revenue7d - revPrev) / revPrev) * 100).toFixed(1) : null;

  const orders7d   = recent7.length;
  const ordersPrev = prev7.length;
  const orderDelta = ordersPrev ? (((orders7d - ordersPrev) / ordersPrev) * 100).toFixed(1) : null;

  const lowStockCount = products.filter((p) => Number(p.stock ?? 0) < 5).length;
  const pendingShip   = orders.filter((o) => normStatus(o.deliveryStatus) === 'processing').length;

  // Sales chart: daily totals for the last 7 days
  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const salesMap = {};
  for (let k = 6; k >= 0; k--) {
    const d = new Date(now - k * MS_DAY);
    const key = d.toISOString().slice(0, 10);
    salesMap[key] = { d: DAY_LABELS[d.getDay()], v: 0 };
  }
  recent7.forEach((o) => {
    const key = String(o.createdAt).slice(0, 10);
    if (salesMap[key]) salesMap[key].v += Number(o.total || o.orderTotal || 0);
  });
  const sales = Object.values(salesMap);

  // Orders by week (last 4 weeks)
  const weekBuckets = [0, 0, 0, 0];
  orders.forEach((o) => {
    const daysAgo = (now - new Date(o.createdAt).getTime()) / MS_DAY;
    if (daysAgo < 7)       weekBuckets[3]++;
    else if (daysAgo < 14) weekBuckets[2]++;
    else if (daysAgo < 21) weekBuckets[1]++;
    else if (daysAgo < 28) weekBuckets[0]++;
  });
  const orderTrend = weekBuckets.map((v, i) => ({ d: `Wk ${i + 1}`, v }));

  // Category mix from products
  const catCount = {};
  products.forEach((p) => { const c = p.category || 'Other'; catCount[c] = (catCount[c] || 0) + 1; });
  const total = products.length || 1;
  const catSplit = Object.entries(catCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count], i) => ({ name, v: Math.round((count / total) * 100), c: PIE_COLORS[i] }));

  // Recent 5 orders
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {exec ? (
          <Stat
            label="Revenue (7d)" value={formatPKR(revenue7d)}
            delta={revDelta !== null ? `${revDelta > 0 ? '+' : ''}${revDelta}%` : '—'}
            up={Number(revDelta) >= 0} icon={TrendingUp}
          />
        ) : (
          <Stat label="Pending Shipments" value={String(pendingShip)} delta="live" up icon={Truck} />
        )}
        <Stat
          label="Orders (7d)" value={String(orders7d)}
          delta={orderDelta !== null ? `${Number(orderDelta) >= 0 ? '+' : ''}${orderDelta}%` : '—'}
          up={Number(orderDelta) >= 0} icon={ShoppingCart}
        />
        <Stat label="Customers" value={String(customers.length)} delta="total" up icon={Users} />
        <Stat label="Low Stock SKUs" value={String(lowStockCount)} delta="< 5 units" icon={Boxes} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Revenue chart */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">Sales - last 7 days</h3>
            <span className="text-xs text-ink-500">PKR</span>
          </div>
          {exec ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sales}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"  stopColor="#ff3131" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#ff3131" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="d" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip formatter={(v) => formatPKR(v)} />
                  <Area type="monotone" dataKey="v" stroke="#ff3131" strokeWidth={2.5} fill="url(#g1)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 grid place-items-center text-center">
              <div>
                <span className="grid place-items-center w-12 h-12 mx-auto rounded-2xl bg-ink-100 text-ink-500"><Lock size={20} /></span>
                <p className="mt-3 font-semibold">Revenue analytics are restricted</p>
                <p className="text-sm text-ink-500 max-w-xs mx-auto">Financial data is visible to Executives only.</p>
              </div>
            </div>
          )}
        </div>

        <div className="card p-5">
          <h3 className="font-bold mb-3">Category Mix</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={catSplit} dataKey="v" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={3}>
                  {catSplit.map((c, i) => <Cell key={i} fill={c.c} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-1 text-xs mt-2">
            {catSplit.map((c) => (
              <div key={c.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.c }} />
                <span className="truncate">{c.name}</span>
                <span className="ml-auto text-ink-500">{c.v}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card p-5">
          <h3 className="font-bold mb-3">Orders by Week</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={orderTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="d" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="v" fill="#ff3131" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5 lg:col-span-2 overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">Recent Orders</h3>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-ink-500">No orders yet.</p>
          ) : (
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-ink-500 text-xs uppercase tracking-wider">
                    {['Order', 'Customer', 'City', ...(exec ? ['Total'] : []), 'Status'].map((h) => (
                      <th key={h} className="px-5 py-2 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o) => {
                    const st = normStatus(o.deliveryStatus) || 'pending';
                    return (
                      <tr key={o.id} className="border-t border-ink-100 dark:border-white/10">
                        <td className="px-5 py-3 font-mono">{o.id}</td>
                        <td className="px-5 py-3 font-medium">{o.customerName || '—'}</td>
                        <td className="px-5 py-3 text-ink-500">{o.city || '—'}</td>
                        {exec && <td className="px-5 py-3 font-semibold">{formatPKR(o.total || o.orderTotal || 0)}</td>}
                        <td className="px-5 py-3">
                          <span className={`badge ring-1 capitalize ${statusColor[st] || 'bg-ink-100 text-ink-700'}`}>{st.replace(/-/g, ' ')}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, delta, up, icon: Icon }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-ink-500 font-bold">{label}</div>
          <div className="text-2xl font-extrabold mt-1">{value}</div>
        </div>
        <span className="grid place-items-center w-10 h-10 rounded-xl bg-brand-50 text-brand-700"><Icon size={18} /></span>
      </div>
      <div className={`mt-3 inline-flex items-center gap-1 text-xs font-semibold ${up ? 'text-brand-600' : 'text-rose-600'}`}>
        {up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} {delta}
      </div>
    </div>
  );
}
