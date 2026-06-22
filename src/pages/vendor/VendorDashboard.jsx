import { useEffect, useState } from 'react';
import { Package, ShoppingBag, FileText, TrendingUp, Boxes } from 'lucide-react';
import { vendorProductsApi, vendorOrdersApi, vendorRevenueApi, vendorListingRequestsApi } from '../../api/client';
import { formatPKR } from '../../utils/format';

function Card({ icon: Icon, title, value, sub, accent }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-ink-500 font-semibold uppercase tracking-wider">{title}</div>
          <div className="mt-1 text-2xl font-extrabold">{value}</div>
          {sub && <div className="text-xs text-ink-500 mt-1">{sub}</div>}
        </div>
        <div className={'grid place-items-center w-11 h-11 rounded-xl ' + (accent || 'bg-brand-50 text-brand-700')}><Icon size={20} /></div>
      </div>
    </div>
  );
}

export default function VendorDashboard() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [revenue, setRevenue] = useState({
    revenue: 0, net: 0, commission: 0, commissionPct: 0,
    units: 0, deliveredOrders: 0, totalOrders: 0
  });
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([vendorProductsApi(), vendorOrdersApi(), vendorRevenueApi(), vendorListingRequestsApi()])
      .then(([p, o, r, lr]) => {
        if (p.status === 'fulfilled') setProducts(p.value?.products || []);
        if (o.status === 'fulfilled') setOrders(o.value?.orders || []);
        if (r.status === 'fulfilled') setRevenue(r.value || {});
        if (lr.status === 'fulfilled') setRequests(lr.value?.requests || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalStock = products.reduce((s, p) => s + (Number(p.stock) || 0), 0);
  const pendingReq = requests.filter((r) => r.status === 'pending').length;
  const inTransit = orders.filter((o) => (o.delivery_status || '').toLowerCase() === 'in transit').length;

  if (loading) return <div className="text-ink-500">Loading your dashboard...</div>;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold">Dashboard</h1>
        <p className="text-sm text-ink-500">Your products, orders, listing requests and revenue at a glance.</p>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card icon={Package} title="My Products" value={products.length} sub={`${totalStock} units in stock`} />
        <Card
          icon={ShoppingBag}
          title="Orders"
          value={revenue.totalOrders ?? orders.length}
          sub={`${revenue.deliveredOrders ?? 0} delivered · ${inTransit} in transit`}
          accent="bg-amber-50 text-amber-700"
        />
        <Card
          icon={FileText}
          title="Listing Requests"
          value={requests.length}
          sub={`${pendingReq} awaiting review`}
          accent="bg-blue-50 text-blue-700"
        />
        <Card
          icon={TrendingUp}
          title="Net revenue"
          value={formatPKR(revenue.net ?? 0)}
          sub={
            revenue.commission != null
              ? `Gross ${formatPKR(revenue.revenue ?? 0)} · slab commission ${formatPKR(revenue.commission ?? 0)}`
              : `Gross sales of your SKUs (${revenue.units ?? 0} units delivered)`
          }
          accent="bg-emerald-50 text-emerald-700"
        />
      </div>

      <section className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-extrabold flex items-center gap-2"><Boxes size={16} className="text-brand-700" /> My Products (name &amp; quantity)</h2>
          <a href="/vendor/products" className="text-xs font-semibold text-brand-700">View all →</a>
        </div>
        {products.length === 0 ? (
          <div className="text-sm text-ink-500">No products tagged to you yet. Submit a <a href="/vendor/listing-requests" className="text-brand-700 font-semibold">new listing request</a> or ask Maxx admin to assign your existing SKUs.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-ink-500 uppercase tracking-wider">
                <tr><th className="py-2 pr-3">Product</th><th className="py-2 pr-3">Brand</th><th className="py-2 pr-3">Price</th><th className="py-2 pr-3">Stock</th></tr>
              </thead>
              <tbody>
                {products.slice(0, 6).map((p) => (
                  <tr key={p.id} className="border-t border-ink-100 dark:border-white/10">
                    <td className="py-2 pr-3 font-medium">{p.title}</td>
                    <td className="py-2 pr-3 text-ink-500">{p.brand || '-'}</td>
                    <td className="py-2 pr-3 font-semibold text-brand-700">{formatPKR(p.price)}</td>
                    <td className="py-2 pr-3"><span className={'badge ' + (Number(p.stock) < 10 ? 'bg-rose-50 text-rose-700' : 'bg-brand-50 text-brand-700')}>{p.stock}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-extrabold flex items-center gap-2"><ShoppingBag size={16} className="text-amber-600" /> Recent orders</h2>
          <a href="/vendor/orders" className="text-xs font-semibold text-brand-700">View all →</a>
        </div>
        {orders.length === 0 ? (
          <div className="text-sm text-ink-500">No orders yet. They will appear here as customers buy your products.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-ink-500 uppercase tracking-wider">
                <tr><th className="py-2 pr-3">Order #</th><th className="py-2 pr-3">Date</th><th className="py-2 pr-3">Items</th><th className="py-2 pr-3">Total</th><th className="py-2 pr-3">Status</th></tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map((o) => (
                  <tr key={o.id} className="border-t border-ink-100 dark:border-white/10">
                    <td className="py-2 pr-3 font-mono text-xs">{o.id?.slice(0, 8) || '-'}</td>
                    <td className="py-2 pr-3 text-ink-500">{(o.created_at || '').slice(0, 10)}</td>
                    <td className="py-2 pr-3">{o.items?.length || 0}</td>
                    <td className="py-2 pr-3 font-semibold">{formatPKR(o.total || 0)}</td>
                    <td className="py-2 pr-3"><span className="badge bg-ink-100 text-ink-700">{o.delivery_status || 'Pending'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
