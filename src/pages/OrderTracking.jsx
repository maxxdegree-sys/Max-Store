import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CheckCircle2, ClipboardCheck, Package, Truck, Home, Search, XCircle, ExternalLink, Clock } from 'lucide-react';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import SEO from '../components/seo/SEO';
import { formatPKR, formatDateTime, formatDate } from '../utils/format';
import { courierName, courierTrackingUrl } from '../utils/couriers';
import { stageIndex, isCancelled } from '../utils/orderStatus';
import { orderTrackApi } from '../api/client';

const stages = [
  { label: 'Order Placed',     icon: CheckCircle2 },
  { label: 'Confirmed',        icon: ClipboardCheck },
  { label: 'Shipped',          icon: Package },
  { label: 'Out for Delivery', icon: Truck },
  { label: 'Delivered',        icon: Home }
];

export default function OrderTracking() {
  const [params] = useSearchParams();
  const [orderId, setOrderId] = useState(params.get('id') || '');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const track = async (e) => {
    e?.preventDefault();
    const id = orderId.trim();
    if (!id) return toast.error('Enter your order number');
    setLoading(true); setNotFound(false); setOrder(null);
    try {
      const data = await orderTrackApi(id);
      setOrder(data.order);
    } catch (err) {
      if (err.status === 404) setNotFound(true);
      else toast.error(err.message || 'Could not track order');
    } finally {
      setLoading(false);
    }
  };

  const status = order?.deliveryStatus || '';
  const cancelled = isCancelled(status);
  const activeIdx = stageIndex(status);
  // Show the most recent update first, the way courier apps do.
  const events = Array.isArray(order?.timeline) ? [...order.timeline].reverse() : [];
  const trackUrl = order ? courierTrackingUrl(order.courier) : '';

  return (
    <>
      <SEO title="Track Order" />
      <Breadcrumbs items={[{ label: 'Track Order' }]} />
      <div className="container-px pb-14">
        <h1 className="text-2xl sm:text-3xl font-extrabold mb-2">Track Your Order</h1>
        <p className="text-ink-500 mb-6 text-sm">Enter your order number to see its current status.</p>

        <div className="card p-5">
          <form onSubmit={track} className="flex items-center gap-2 mb-6">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
              <input value={orderId} onChange={(e) => setOrderId(e.target.value)} className="input pl-9" placeholder="Order number (e.g. ARS-1759312345678)" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Tracking…' : 'Track'}</button>
          </form>

          {notFound && (
            <div className="rounded-xl bg-rose-50 dark:bg-rose-900/20 p-4 text-sm text-rose-700 dark:text-rose-200 flex items-center gap-2">
              <XCircle size={16} /> No order found with that number. Double-check the ID from your confirmation.
            </div>
          )}

          {order && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
                <div>
                  <div className="font-mono font-bold text-brand-700">{order.id}</div>
                  <div className="text-xs text-ink-500">Placed by {order.customerName} · {order.city}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-ink-500">Order total</div>
                  <div className="font-extrabold">{formatPKR(order.total)}</div>
                </div>
              </div>

              {cancelled ? (
                <div className="rounded-xl bg-rose-50 dark:bg-rose-900/20 p-4 text-sm text-rose-700 dark:text-rose-200 flex items-center gap-2">
                  <XCircle size={16} /> This order was cancelled.
                </div>
              ) : (
                <div className="relative grid grid-cols-5 gap-2">
                  <div className="absolute top-5 left-[10%] right-[10%] h-1 bg-ink-200 dark:bg-white/10 rounded-full" />
                  <div className="absolute top-5 left-[10%] h-1 bg-brand-gradient rounded-full transition-all" style={{ width: `${(activeIdx / (stages.length - 1)) * 80}%` }} />
                  {stages.map((st, i) => {
                    const reached = i <= activeIdx;
                    return (
                      <div key={st.label} className="relative flex flex-col items-center text-center">
                        <span className={`relative grid place-items-center w-10 h-10 rounded-full ${reached ? 'bg-brand-600 text-white shadow-glow' : 'bg-ink-100 text-ink-400'}`}>
                          <st.icon size={18} />
                        </span>
                        <div className={`mt-2 text-[11px] sm:text-sm font-semibold leading-tight ${reached ? '' : 'text-ink-400'}`}>{st.label}</div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-8 grid sm:grid-cols-2 gap-4">
                <div className="rounded-xl bg-brand-50 dark:bg-brand-900/30 p-4 text-sm">
                  <div className="font-bold text-brand-800 dark:text-brand-200">Delivery Status</div>
                  <div className="mt-1 text-ink-700 dark:text-ink-200 capitalize">{order.deliveryStatus}</div>
                  {order.estDelivery && !cancelled && (
                    <div className="mt-2 text-xs text-ink-500">Estimated delivery: <span className="font-semibold text-ink-700 dark:text-ink-200">{formatDate(order.estDelivery)}</span></div>
                  )}
                </div>
                <div className="rounded-xl border border-ink-100 dark:border-white/10 p-4 text-sm">
                  <div className="font-bold">Payment</div>
                  <div className="mt-1 text-ink-500">{order.paymentMethod} · {order.paymentStatus}</div>
                </div>

                {order.courier && (
                  <div className="rounded-xl border border-ink-100 dark:border-white/10 p-4 text-sm sm:col-span-2">
                    <div className="font-bold">Courier</div>
                    <div className="mt-1 text-ink-600 dark:text-ink-300">
                      {courierName(order.courier)}{order.tracking ? <> · CN <span className="font-mono font-semibold">{order.tracking}</span></> : ''}
                    </div>
                    {trackUrl && (
                      <a href={trackUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-brand-700 font-semibold">
                        Track on {courierName(order.courier)} site <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                )}
              </div>

              {events.length > 0 && !cancelled && (
                <div className="mt-8">
                  <h3 className="font-bold mb-3 flex items-center gap-2"><Clock size={16} className="text-ink-500" /> Tracking History</h3>
                  <ol className="relative ml-2 border-l border-ink-200 dark:border-white/10">
                    {events.map((ev, i) => (
                      <li key={i} className="ml-5 pb-5 last:pb-0">
                        <span className={`absolute -left-[7px] mt-1 w-3.5 h-3.5 rounded-full ring-4 ring-white dark:ring-ink-900 ${i === 0 ? 'bg-brand-600' : 'bg-ink-300 dark:bg-white/20'}`} />
                        <div className="text-sm font-semibold capitalize">{ev.status}</div>
                        <div className="text-xs text-ink-500">{formatDateTime(ev.at)}</div>
                        {ev.note && <div className="text-xs text-ink-600 dark:text-ink-300 mt-0.5">{ev.note}</div>}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <div className="mt-6">
                <h3 className="font-bold mb-3">Items ({order.items.length})</h3>
                <ul className="space-y-2">
                  {order.items.map((it, i) => (
                    <li key={i} className="flex items-center justify-between text-sm border-b border-ink-100 dark:border-white/10 pb-2">
                      <span className="font-medium">{it.name || it.title} <span className="text-ink-500">× {it.qty}</span></span>
                      <span className="font-semibold">{formatPKR((it.price || 0) * (it.qty || 1))}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {!order && !notFound && !loading && (
            <p className="text-sm text-ink-500">Tip: your order number is shown on the confirmation screen right after checkout.</p>
          )}
        </div>
      </div>
    </>
  );
}
