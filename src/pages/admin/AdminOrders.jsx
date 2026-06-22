import { useEffect, useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatPKR } from '../../utils/format';
import { ORDER_STATUSES, statusColor } from '../../utils/orderStatus';
import { COURIERS } from '../../utils/couriers';
import ExportMenu from '../../components/admin/ExportMenu';
import { ordersListApi, orderUpdateApi } from '../../api/client';

const STATUS_FILTERS = ['All', ...ORDER_STATUSES];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState('All');
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    ordersListApi()
      .then((data) => setOrders(data.orders || []))
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  }, []);

  const list = orders.filter((o) => {
    const status = o.deliveryStatus || '';
    const matchStatus = active === 'All' || status === active;
    const matchQ = !q || (o.id + (o.customerName || '') + (o.city || '')).toLowerCase().includes(q.toLowerCase());
    return matchStatus && matchQ;
  });

  const openManage = (o) => {
    setForm({
      deliveryStatus: o.deliveryStatus || 'Placed',
      courier: o.courier || '',
      tracking: o.tracking || '',
      estDelivery: o.estDelivery ? String(o.estDelivery).slice(0, 10) : '',
      statusNote: ''
    });
    setEditing(o);
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const { order } = await orderUpdateApi(editing.id, {
        deliveryStatus: form.deliveryStatus,
        courier: form.courier,
        tracking: form.tracking.trim(),
        estDelivery: form.estDelivery || null,
        statusNote: form.statusNote.trim()
      });
      setOrders((prev) => prev.map((o) => (o.id === order.id ? order : o)));
      toast.success('Order updated');
      setEditing(null);
    } catch (err) {
      toast.error(err.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl font-extrabold">Orders ({list.length})</h1>
        <div className="flex items-center gap-2 ml-auto">
          <ExportMenu entity="orders" filters={{ deliveryStatus: active === 'All' ? '' : active }} />
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search orders…" className="input pl-9 !py-2 !text-sm w-64" />
          </div>
        </div>
      </header>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        <Filter size={14} className="text-ink-500 shrink-0" />
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActive(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition whitespace-nowrap ${active === f ? 'bg-brand-gradient text-white border-transparent' : 'bg-white dark:bg-ink-900 border-ink-200 dark:border-white/10 hover:border-brand-300'}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-10 text-center text-ink-500 text-sm">Loading orders…</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-ink-100/60 dark:bg-white/5 text-left">
                <tr>{['Order', 'Customer', 'City', 'Items', 'Payment', 'Total', 'Status', 'Date', ''].map((h, i) => <th key={h || i} className="px-4 py-3 text-xs uppercase tracking-wider font-bold text-ink-500">{h}</th>)}</tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-10 text-center text-ink-500">No orders found.</td></tr>
                ) : list.map((o) => (
                  <tr key={o.id} className="border-t border-ink-100 dark:border-white/10 hover:bg-ink-100/40 dark:hover:bg-white/5">
                    <td className="px-4 py-3 font-mono">{o.id}</td>
                    <td className="px-4 py-3 font-medium">{o.customerName}</td>
                    <td className="px-4 py-3 text-ink-500">{o.city}</td>
                    <td className="px-4 py-3">{Array.isArray(o.items) ? o.items.length : 0}</td>
                    <td className="px-4 py-3">{o.paymentMethod}</td>
                    <td className="px-4 py-3 font-semibold">{formatPKR(o.total)}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ring-1 ${statusColor[o.deliveryStatus] || 'bg-ink-100 text-ink-700 ring-ink-200'}`}>{o.deliveryStatus}</span>
                    </td>
                    <td className="px-4 py-3 text-ink-500">{o.createdAt ? String(o.createdAt).slice(0, 10) : ''}</td>
                    <td className="px-4 py-3 text-right"><button onClick={() => openManage(o)} className="text-brand-700 text-xs font-semibold hover:underline">Manage</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => !saving && setEditing(null)}>
          <div className="card w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-extrabold text-lg">Manage Order</h2>
                <div className="font-mono text-xs text-ink-500">{editing.id} · {editing.customerName}</div>
              </div>
              <button onClick={() => setEditing(null)} disabled={saving} className="text-ink-500 hover:text-ink-700"><X size={18} /></button>
            </div>

            <div className="space-y-3">
              <label className="block text-sm">
                <span className="font-semibold">Delivery status</span>
                <select value={form.deliveryStatus} onChange={set('deliveryStatus')} className="input mt-1">
                  {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm">
                  <span className="font-semibold">Courier</span>
                  <select value={form.courier} onChange={set('courier')} className="input mt-1">
                    <option value="">— none —</option>
                    {COURIERS.filter((c) => c.id !== 'other').map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    <option value="other">Other</option>
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="font-semibold">CN / tracking #</span>
                  <input value={form.tracking} onChange={set('tracking')} className="input mt-1" placeholder="e.g. 123456789012" />
                </label>
              </div>

              <label className="block text-sm">
                <span className="font-semibold">Estimated delivery</span>
                <input type="date" value={form.estDelivery} onChange={set('estDelivery')} className="input mt-1" />
              </label>

              <label className="block text-sm">
                <span className="font-semibold">Note <span className="text-ink-500 font-normal">(optional — shown to the customer on the timeline)</span></span>
                <input value={form.statusNote} onChange={set('statusNote')} className="input mt-1" placeholder="e.g. Handed to courier, expect a call" />
              </label>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setEditing(null)} disabled={saving} className="px-4 py-2 rounded-xl border border-ink-200 dark:border-white/10 text-sm font-semibold">Cancel</button>
              <button onClick={save} disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
