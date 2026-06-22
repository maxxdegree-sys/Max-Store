import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { Trash2, ShoppingBag, Tag, ArrowRight } from 'lucide-react';
import {
  selectCartItems, selectCartSubtotal, selectCartDiscount, selectCartTotal,
  removeFromCart, updateQty, applyCoupon, clearCart
} from '../store/cartSlice';
import { couponValidateApi } from '../api/client';
import { formatPKR } from '../utils/format';
import QuantitySelector from '../components/ui/QuantitySelector';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import SEO from '../components/seo/SEO';

export default function Cart() {
  const items     = useSelector(selectCartItems);
  const subtotal  = useSelector(selectCartSubtotal);
  const discount  = useSelector(selectCartDiscount);
  const total     = useSelector(selectCartTotal);
  const dispatch  = useDispatch();
  const [code, setCode] = useState('');

  const apply = async () => {
    if (!code.trim()) return toast.error('Enter a coupon code');
    try {
      const data = await couponValidateApi(code.trim(), subtotal);
      dispatch(applyCoupon({
        code: data.coupon.code,
        percent: data.coupon.percent || 0,
        fixedAmount: data.coupon.fixedAmount || 0,
        discount: data.coupon.discount || 0
      }));
      const label = data.coupon.percent
        ? `${data.coupon.percent}% off applied!`
        : data.coupon.fixedAmount
          ? `PKR ${data.coupon.fixedAmount} off applied!`
          : 'Coupon applied!';
      toast.success(label);
    } catch (err) {
      toast.error(err.message || 'Invalid coupon code');
    }
  };

  return (
    <>
      <SEO title="Your Cart" url="https://alrafiq.pk/cart" />
      <Breadcrumbs items={[{ label: 'Cart' }]} />
      <div className="container-px pb-14">
        <h1 className="text-2xl sm:text-3xl font-extrabold mb-6">Shopping Cart</h1>
        {items.length === 0 ? (
          <div className="card p-12 text-center">
            <ShoppingBag size={48} className="mx-auto text-ink-300 mb-4" />
            <h3 className="font-bold text-lg">Your cart is empty</h3>
            <p className="text-ink-500 mb-5">Looks like you haven't added anything yet.</p>
            <Link to="/shop" className="btn-primary">Continue Shopping</Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_360px] gap-6">
            <div className="space-y-3">
              {items.map((it) => (
                <div key={it.id} className="card p-4 flex gap-4 items-center">
                  <img src={it.image} alt={it.title} className="w-24 h-24 rounded-xl object-cover" />
                  <div className="flex-1 min-w-0">
                    <Link to={`/product/${it.slug}`} className="font-semibold hover:text-brand-700 line-clamp-2">{it.title}</Link>
                    {it.variant && <div className="text-xs text-ink-500 mt-0.5">Variant: {it.variant}</div>}
                    <div className="text-brand-700 font-bold mt-1">{formatPKR(it.price)}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <QuantitySelector value={it.qty} onChange={(q) => dispatch(updateQty({ id: it.id, qty: q }))} />
                    <button onClick={() => dispatch(removeFromCart(it.id))} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              <button onClick={() => dispatch(clearCart())} className="btn-ghost text-sm text-red-600">Clear cart</button>
            </div>

            <aside className="lg:sticky lg:top-24 self-start">
              <div className="card p-5 space-y-4">
                <h3 className="font-bold">Order Summary</h3>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
                    <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Coupon code" className="input pl-8" />
                  </div>
                  <button onClick={apply} className="btn-outline">Apply</button>
                </div>
                <div className="text-xs text-ink-500">Enter your coupon code above</div>

                <div className="space-y-2 text-sm border-t pt-3 border-ink-100 dark:border-white/10">
                  <Row label="Subtotal" value={formatPKR(subtotal)} />
                  {discount > 0 && <Row label="Discount" value={`- ${formatPKR(discount)}`} green />}
                  <Row label="Shipping" value="Calculated at checkout" muted />
                  <div className="border-t border-ink-100 dark:border-white/10 pt-2 mt-2 flex items-center justify-between">
                    <span className="font-bold">Total</span>
                    <span className="font-extrabold text-lg text-brand-700">{formatPKR(total)}</span>
                  </div>
                </div>

                <Link to="/checkout" className="btn-primary w-full !py-3">
                  Proceed to Checkout <ArrowRight size={16} />
                </Link>
                <Link to="/shop" className="btn-ghost w-full text-sm">Continue Shopping</Link>
              </div>
            </aside>
          </div>
        )}
      </div>
    </>
  );
}

function Row({ label, value, green, muted }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-500">{label}</span>
      <span className={`font-semibold ${green ? 'text-brand-600' : muted ? 'text-ink-500 text-xs' : ''}`}>{value}</span>
    </div>
  );
}
