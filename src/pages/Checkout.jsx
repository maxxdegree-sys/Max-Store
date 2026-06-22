import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
  CheckCircle2, Truck, Wallet, PackageOpen, Info
} from 'lucide-react';
import {
  selectCartItems, selectCartSubtotal, selectCartDiscount, selectCartTotal, selectCartCoupon,
  clearCart, setShipping
} from '../store/cartSlice';
import { selectUser } from '../store/authSlice';
import { orderCheckoutApi, addressesListApi, addressCreateApi, getCustomerToken } from '../api/client';
import { formatPKR } from '../utils/format';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import SEO from '../components/seo/SEO';
import { useDeliveryLocation } from '../context/LocationContext';
import { DEFAULT_LOCATION } from '../data/pakistanCities';

// Shipping fees
// Standard delivery is FREE. Allow-to-Open service is a flat Rs. 300.
const STANDARD_FEE = 0;
const ALLOW_OPEN_FEE = 300;

export default function Checkout() {
  const items    = useSelector(selectCartItems);
  const subtotal = useSelector(selectCartSubtotal);
  const discount = useSelector(selectCartDiscount);
  const total    = useSelector(selectCartTotal);
  const coupon   = useSelector(selectCartCoupon);
  const user     = useSelector(selectUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { location: deliveryLoc } = useDeliveryLocation();

  const [form, setForm] = useState({
    name: '', phone: '', email: '', address: '',
    city: deliveryLoc.city || DEFAULT_LOCATION.city,
    province: deliveryLoc.province || DEFAULT_LOCATION.province
  });
  const [shipMethod, setShipMethod] = useState('standard'); // 'standard' | 'allow-open'
  const [placed, setPlaced] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [addresses, setAddresses] = useState([]);
  const [selectedAddr, setSelectedAddr] = useState('');   // saved address id, or '' for new
  const [saveAddr, setSaveAddr] = useState(false);

  const loggedIn = !!user && !!getCustomerToken();

  const fillFromAddress = (a) => setForm((f) => ({
    ...f,
    name: a.name || f.name,
    phone: a.phone || f.phone,
    address: a.address || '',
    city: a.city || f.city,
    province: a.province || f.province
  }));

  // Sync checkout city with delivery location picker (unless using a saved address).
  useEffect(() => {
    if (selectedAddr || !deliveryLoc?.city) return;
    setForm((f) => ({
      ...f,
      city: f.city === DEFAULT_LOCATION.city || !f.city ? deliveryLoc.city : f.city,
      province: f.province === DEFAULT_LOCATION.province || !f.province ? deliveryLoc.province : f.province
    }));
  }, [deliveryLoc?.city, deliveryLoc?.province, selectedAddr]);

  // Prefill from the signed-in account so returning customers check out faster.
  useEffect(() => {
    if (!user) return;
    setForm((f) => ({
      ...f,
      name: f.name || user.name || '',
      phone: f.phone || user.phone || '',
      email: f.email || user.email || '',
      address: f.address || user.address || '',
      city: user.city || f.city
    }));
  }, [user]);

  // Load saved addresses for signed-in customers and select the default one.
  useEffect(() => {
    if (!loggedIn) return;
    addressesListApi()
      .then(({ addresses: list = [] }) => {
        setAddresses(list);
        const def = list.find((a) => a.isDefault) || list[0];
        if (def) { setSelectedAddr(def.id); fillFromAddress(def); }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn]);

  const pickAddress = (id) => {
    setSelectedAddr(id);
    if (id === '') return; // "new address"
    const a = addresses.find((x) => x.id === id);
    if (a) fillFromAddress(a);
  };

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const shippingFee = shipMethod === 'allow-open' ? ALLOW_OPEN_FEE : STANDARD_FEE;
  const grandTotal = total + shippingFee;

  const placeOrder = async (e) => {
    e.preventDefault();
    if (placing) return;
    if (!form.name || !form.phone || !form.address) return toast.error('Please fill required fields');
    if (items.length === 0) return toast.error('Your cart is empty');

    const order = {
      customerName: form.name.trim(),
      customerPhone: form.phone.trim(),
      email: form.email.trim(),
      city: form.city.trim(),
      address: form.address.trim(),
      items: items.map((it) => ({
        sku: it.id, name: it.title, qty: it.qty, price: it.price,
        variant: it.variant || '', image: it.image || ''
      })),
      subtotal,
      discount,
      couponCode: coupon?.code || '',
      shipping: shippingFee,
      total: grandTotal,
      paymentMethod: 'COD',
      notes: ''
    };

    setPlacing(true);
    try {
      const data = await orderCheckoutApi(order);
      const newId = data?.order?.id || '';
      // Optionally save this as a new address on the customer's account.
      if (loggedIn && saveAddr && selectedAddr === '') {
        try {
          await addressCreateApi({
            label: 'Home', name: form.name.trim(), phone: form.phone.trim(),
            address: form.address.trim(), city: form.city.trim(), province: form.province.trim(),
            isDefault: addresses.length === 0
          });
        } catch { /* non-fatal */ }
      }
      dispatch(setShipping(shippingFee));
      setOrderId(newId);
      setPlaced(true);
      toast.success('Order placed successfully!');
      setTimeout(() => { dispatch(clearCart()); navigate(newId ? `/order-tracking?id=${encodeURIComponent(newId)}` : '/order-tracking'); }, 2400);
    } catch (err) {
      toast.error(err.message || 'Could not place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  if (placed) {
    return (
      <div className="min-h-[60vh] grid place-items-center text-center container-px">
        <div>
          <CheckCircle2 className="mx-auto text-brand-500" size={64} />
          <h2 className="text-2xl font-extrabold mt-3">Thank you! Order placed.</h2>
          {orderId && <p className="mt-1 font-mono text-sm text-brand-700">Order #{orderId}</p>}
          <p className="text-ink-500 mt-2">
            Pay cash on delivery. We will email you the dispatch update.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO title="Checkout" url="https://alrafiq.pk/checkout" />
      <Breadcrumbs items={[{ to: '/cart', label: 'Cart' }, { label: 'Checkout' }]} />
      <div className="container-px pb-14">
        <h1 className="text-2xl sm:text-3xl font-extrabold mb-6">Secure Checkout</h1>

        <form onSubmit={placeOrder} className="grid lg:grid-cols-[1fr_380px] gap-6">
          <div className="space-y-5">
            {/* Shipping address */}
            <section className="card p-5">
              <h3 className="font-bold mb-3">Shipping Information</h3>

              {loggedIn && addresses.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs font-semibold mb-2 text-ink-700 dark:text-ink-200">Deliver to a saved address</div>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {addresses.map((a) => (
                      <button
                        type="button"
                        key={a.id}
                        onClick={() => pickAddress(a.id)}
                        className={`text-left rounded-xl border p-3 text-sm transition ${selectedAddr === a.id ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/30' : 'border-ink-200 hover:border-brand-300'}`}
                      >
                        <div className="font-semibold flex items-center gap-1.5">{a.label || 'Address'}{a.isDefault && <span className="text-[10px] font-bold text-brand-700">• Default</span>}</div>
                        <div className="text-xs text-ink-500 line-clamp-2">{[a.address, a.city].filter(Boolean).join(', ')}</div>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => { pickAddress(''); setForm((f) => ({ ...f, address: '' })); }}
                      className={`text-left rounded-xl border p-3 text-sm transition ${selectedAddr === '' ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/30' : 'border-ink-200 hover:border-brand-300'}`}
                    >
                      <div className="font-semibold">+ Use a new address</div>
                      <div className="text-xs text-ink-500">Enter the details below</div>
                    </button>
                  </div>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Full Name *" value={form.name}    onChange={update('name')}    />
                <Field label="Phone *"      value={form.phone}   onChange={update('phone')}   type="tel" placeholder="03XX-XXXXXXX" />
                <Field label="Email"        value={form.email}   onChange={update('email')}   type="email" />
                <Field label="City"         value={form.city}    onChange={update('city')}    />
                <Field label="Province"     value={form.province}onChange={update('province')} />
                <Field label="Address *"    value={form.address} onChange={update('address')} className="sm:col-span-2" />
              </div>
              {loggedIn && selectedAddr === '' && (
                <label className="mt-3 inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" className="accent-brand-600" checked={saveAddr} onChange={(e) => setSaveAddr(e.target.checked)} />
                  Save this address to my account
                </label>
              )}
            </section>

            {/* Delivery method — 2 options */}
            <section className="card p-5">
              <h3 className="font-bold mb-3">Delivery Method</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <Option
                  active={shipMethod === 'standard'}
                  onClick={() => setShipMethod('standard')}
                  icon={Truck}
                  title="Standard Delivery"
                  sub="2-4 working days"
                  price="FREE"
                />
                <Option
                  active={shipMethod === 'allow-open'}
                  onClick={() => setShipMethod('allow-open')}
                  icon={PackageOpen}
                  title="Delivery with Allow-to-Open"
                  sub="Inspect before paying"
                  price={`Rs. ${ALLOW_OPEN_FEE.toLocaleString()}`}
                />
              </div>
              {shipMethod === 'allow-open' && (
                <div className="mt-3 rounded-xl bg-brand-50 dark:bg-brand-900/20 p-3 text-xs text-ink-700 dark:text-ink-200 flex items-start gap-2">
                  <Info size={14} className="text-brand-700 mt-0.5 shrink-0" />
                  <div>
                    Our courier will allow you to open and inspect the parcel before you pay or accept the delivery.
                    A flat <b>Rs. {ALLOW_OPEN_FEE}</b> service charge applies for this facility.
                  </div>
                </div>
              )}
            </section>

            {/* Payment method — Cash on Delivery only */}
            <section className="card p-5">
              <h3 className="font-bold mb-3">Payment Method</h3>
              <div className="rounded-xl border border-brand-600 bg-brand-50 dark:bg-brand-900/30 p-4 flex items-start gap-3">
                <span className="grid place-items-center w-10 h-10 rounded-xl bg-brand-600 text-white shrink-0"><Wallet size={20} /></span>
                <div>
                  <div className="font-semibold">Cash on Delivery</div>
                  <div className="text-xs text-ink-500">Pay the courier in cash when your parcel arrives. No advance payment needed.</div>
                </div>
              </div>
            </section>
          </div>

          {/* Order summary */}
          <aside className="lg:sticky lg:top-24 self-start">
            <div className="card p-5 space-y-4">
              <h3 className="font-bold">Order Summary</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {items.map((it) => (
                  <div key={it.id} className="flex items-center gap-3 text-sm">
                    <img src={it.image} className="w-12 h-12 rounded-lg object-cover" alt={it.title} />
                    <div className="flex-1 min-w-0">
                      <div className="line-clamp-1 font-medium">{it.title}</div>
                      <div className="text-xs text-ink-500">Qty: {it.qty}</div>
                    </div>
                    <div className="font-semibold">{formatPKR(it.price * it.qty)}</div>
                  </div>
                ))}
              </div>
              <div className="border-t border-ink-100 dark:border-white/10 pt-3 space-y-2 text-sm">
                <Row label="Subtotal" value={formatPKR(subtotal)} />
                {discount > 0 && <Row label="Discount" value={`- ${formatPKR(discount)}`} green />}
                <Row
                  label={shipMethod === 'allow-open' ? 'Shipping (Allow-to-Open)' : 'Shipping (Standard)'}
                  value={shippingFee === 0 ? 'FREE' : formatPKR(shippingFee)}
                  green={shippingFee === 0}
                />
                <div className="border-t border-ink-100 dark:border-white/10 pt-2 flex items-center justify-between">
                  <span className="font-bold">Total</span>
                  <span className="font-extrabold text-lg text-brand-700">{formatPKR(grandTotal)}</span>
                </div>
              </div>
              <button type="submit" disabled={placing} className="btn-primary w-full !py-3">
                {placing ? 'Placing order…' : 'Place Order (Cash on Delivery)'}
              </button>
              <Link to="/cart" className="btn-ghost text-sm block text-center">Back to Cart</Link>
            </div>
          </aside>
        </form>
      </div>
    </>
  );
}

function Field({ label, className = '', ...props }) {
  return (
    <label className={className}>
      <div className="text-xs font-semibold mb-1 text-ink-700 dark:text-ink-200">{label}</div>
      <input className="input" {...props} />
    </label>
  );
}

function Option({ active, onClick, icon: Icon, title, sub, price }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-xl border p-4 transition ${active ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/30' : 'border-ink-200 hover:border-brand-300'}`}
    >
      <Icon className={active ? 'text-brand-700' : 'text-ink-500'} size={20} />
      <div className="font-semibold mt-2">{title}</div>
      <div className="text-xs text-ink-500">{sub}</div>
      {price && <div className="text-xs font-bold mt-1 text-brand-700">{price}</div>}
    </button>
  );
}

function Row({ label, value, green }) {
  return (
    <div className="flex justify-between">
      <span className="text-ink-500">{label}</span>
      <span className={`font-semibold ${green ? 'text-brand-600' : ''}`}>{value}</span>
    </div>
  );
}
