import { Fragment, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ShoppingBag, Search, Truck, Save } from 'lucide-react';
import { vendorOrdersApi, vendorUpdateOrderApi, vendorCouriersApi } from '../../api/client';
import { formatPKR } from '../../utils/format';

const DEL_STATUSES = ['Placed', 'Processing', 'In Transit', 'Delivered', 'Cancelled', 'Returned'];

export default function VendorOrders() {
  const [orders, setOrders] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(null);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([vendorOrdersApi(), vendorCouriersApi()])
      .then(([o, c]) => {
        setOrders(o?.orders || []);
        setCouriers(c?.couriers || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = orders.filter((o) => {
    const s = q.toLowerCase();
    return !s || (o.id || '').toLowerCase().includes(s) || (o.customer_name || '').toLowerCase().includes(s);
  });

  const startEdit = (o) => {
    setEditing({
      id: o.id,
      deliveryStatus: o.delivery_status || 'Processing',
      tracking: o.tracking || '',
      courier: o.courier || '',
      estDelivery: (o.est_delivery || '').slice(0, 10),
      statusNote: ''
    });
    setOpen(o.id);
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const data = await vendorUpdateOrderApi(editing.id, {
        deliveryStatus: editing.deliveryStatus,
        tracking: editing.tracking,
        courier: editing.courier,
        estDelivery: editing.estDelivery || null,
        statusNote: editing.statusNote
      });
      if (data?.order) {
        setOrders((prev) => prev.map((o) => (o.id === editing.id ? data.order : o)));
      }
      toast.success('Order updated — customer notified');
      setEditing(null);
    } catch (e) {
      toast.error(e.message || 'Could not update order');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2"><ShoppingBag size={20} className="text-amber-600" /> Orders ({filtered.length})</h1>
          <p className="text-sm text-ink-500">Manage shipping, tracking and delivery status for orders with your products. Payment status is set by Maxx admin.</p>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
          <input className="input pl-9 !py-2 !text-sm w-56" placeholder="Search order / customer..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </header>

      {loading ? <div className="text-ink-500">Loading...</div> : filtered.length === 0 ? (
        <div className="card p-6 text-sm text-ink-500">No orders yet. Once a customer buys a product you supply, it appears here.</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-100/60 dark:bg-white/5 text-left">
                <tr>{['Order #', 'Date', 'Customer', 'Items', 'Total', 'Payment', 'Delivery', ''].map((h) => <th key={h} className="px-4 py-3 text-xs uppercase tracking-wider font-bold text-ink-500">{h}</th>)}</tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <Fragment key={o.id}>
                    <tr className="border-t border-ink-100 dark:border-white/10 hover:bg-ink-100/40 dark:hover:bg-white/5">
                      <td className="px-4 py-3 font-mono text-xs">{o.id}</td>
                      <td className="px-4 py-3 text-ink-500">{(o.created_at || '').slice(0, 10)}</td>
                      <td className="px-4 py-3">{o.customer_name || '-'}</td>
                      <td className="px-4 py-3">{o.items?.length || 0}</td>
                      <td className="px-4 py-3 font-semibold">{formatPKR(o.total || 0)}</td>
                      <td className="px-4 py-3"><span className="badge bg-ink-100 text-ink-700">{o.payment_status || '-'}</span></td>
                      <td className="px-4 py-3"><span className="badge bg-ink-100 text-ink-700">{o.delivery_status || '-'}</span></td>
                      <td className="px-4 py-3">
                        <button type="button" onClick={() => startEdit(o)} className="btn-outline !py-1.5 !px-3 text-xs"><Truck size={13} /> Manage</button>
                      </td>
                    </tr>
                    {open === o.id && editing?.id === o.id && (
                      <tr>
                        <td colSpan={8} className="px-4 py-4 bg-ink-50 dark:bg-white/5 border-t border-ink-100 dark:border-white/10">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <div className="text-xs font-semibold mb-2 text-ink-500 uppercase tracking-wider">Your items</div>
                              <ul className="text-sm space-y-1 mb-4">
                                {(o.items || []).map((it, i) => (
                                  <li key={i}>{it.name} × {it.qty} — {formatPKR(it.subtotal)}</li>
                                ))}
                              </ul>
                              <p className="text-xs text-ink-500">Payment method: <b>{o.payment_method || 'COD'}</b></p>
                            </div>
                            <div className="space-y-3">
                              <div className="text-xs font-semibold text-ink-500 uppercase tracking-wider flex items-center gap-1"><Truck size={14} /> Shipping &amp; delivery</div>
                              <label className="text-sm block">
                                <span className="font-semibold text-xs">Delivery status</span>
                                <select className="input !py-2 !text-sm mt-1" value={editing.deliveryStatus} onChange={(e) => setEditing({ ...editing, deliveryStatus: e.target.value })}>
                                  {DEL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                              </label>
                              <div className="text-sm">
                                <span className="font-semibold text-xs">Payment status</span>
                                <div className="mt-1 flex items-center gap-2">
                                  <span className="badge bg-ink-100 dark:bg-white/10 text-ink-700">{o.payment_status || 'Pending'}</span>
                                  <span className="text-[11px] text-ink-400">Managed by Maxx admin</span>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <label className="text-sm block">
                                  <span className="font-semibold text-xs">Courier</span>
                                  <select className="input !py-2 !text-sm mt-1" value={editing.courier} onChange={(e) => setEditing({ ...editing, courier: e.target.value })}>
                                    <option value="">— Select —</option>
                                    {couriers.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                                  </select>
                                </label>
                                <label className="text-sm block">
                                  <span className="font-semibold text-xs">Tracking #</span>
                                  <input className="input !py-2 !text-sm mt-1" value={editing.tracking} onChange={(e) => setEditing({ ...editing, tracking: e.target.value })} placeholder="CN / tracking" />
                                </label>
                              </div>
                              <label className="text-sm block">
                                <span className="font-semibold text-xs">Est. delivery</span>
                                <input type="date" className="input !py-2 !text-sm mt-1" value={editing.estDelivery} onChange={(e) => setEditing({ ...editing, estDelivery: e.target.value })} />
                              </label>
                              <label className="text-sm block">
                                <span className="font-semibold text-xs">Note to customer (optional)</span>
                                <input className="input !py-2 !text-sm mt-1" value={editing.statusNote} onChange={(e) => setEditing({ ...editing, statusNote: e.target.value })} placeholder="e.g. Out for delivery" />
                              </label>
                              <div className="flex gap-2 pt-1">
                                <button type="button" disabled={saving} onClick={save} className="btn-primary !py-2 text-sm disabled:opacity-60"><Save size={14} /> Save &amp; notify customer</button>
                                <button type="button" onClick={() => { setEditing(null); setOpen(null); }} className="btn-ghost !py-2 text-sm">Cancel</button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
