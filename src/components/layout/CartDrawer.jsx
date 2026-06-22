import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import {
  selectCartItems, selectCartSubtotal, removeFromCart, updateQty
} from '../../store/cartSlice';
import { closeCartDrawer } from '../../store/uiSlice';
import { formatPKR } from '../../utils/format';

export default function CartDrawer() {
  const open = useSelector((s) => s.ui.cartDrawerOpen);
  const items = useSelector(selectCartItems);
  const subtotal = useSelector(selectCartSubtotal);
  const dispatch = useDispatch();
  const location = useLocation();
  const close = () => dispatch(closeCartDrawer());

  // Never leave the drawer open after navigating (e.g. Checkout link).
  useEffect(() => {
    dispatch(closeCartDrawer());
  }, [location.pathname, dispatch]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') dispatch(closeCartDrawer()); };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, dispatch]);

  const drawer = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100]"
          role="dialog"
          aria-modal="true"
          aria-label="Shopping cart"
        >
          <div className="absolute inset-0 bg-black/40" onClick={close} aria-hidden="true" />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween' }}
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-0 h-full w-[92%] max-w-md bg-white dark:bg-ink-900 shadow-2xl flex flex-col"
          >
            <header className="relative z-10 flex items-center justify-between p-4 border-b border-ink-100 dark:border-white/10">
              <h3 className="font-bold flex items-center gap-2"><ShoppingBag size={18} /> Your Cart ({items.length})</h3>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); close(); }}
                aria-label="Close cart"
                className="btn-ghost !p-2 relative z-10"
              >
                <X size={22} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.length === 0 ? (
                <div className="text-center text-ink-500 py-20">
                  <ShoppingBag size={42} className="mx-auto mb-3 opacity-40" />
                  <p className="font-medium">Your cart is empty</p>
                  <Link to="/shop" onClick={close} className="btn-primary mt-4">Start Shopping</Link>
                </div>
              ) : items.map((it) => (
                <div key={it.id} className="flex gap-3 rounded-xl border border-ink-100 dark:border-white/10 p-3">
                  <img src={it.image} alt={it.title} className="w-16 h-16 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium line-clamp-2">{it.title}</div>
                    <div className="text-brand-700 font-bold text-sm mt-1">{formatPKR(it.price)}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <button type="button" onClick={() => dispatch(updateQty({ id: it.id, qty: it.qty - 1 }))} className="btn-ghost !p-1.5"><Minus size={14} /></button>
                      <span className="text-sm font-semibold w-6 text-center">{it.qty}</span>
                      <button type="button" onClick={() => dispatch(updateQty({ id: it.id, qty: it.qty + 1 }))} className="btn-ghost !p-1.5"><Plus size={14} /></button>
                      <button type="button" onClick={() => dispatch(removeFromCart(it.id))} className="ml-auto text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-lg"><Trash2 size={16} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {items.length > 0 && (
              <footer className="border-t border-ink-100 dark:border-white/10 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-ink-500">Subtotal</span>
                  <span className="font-extrabold text-lg">{formatPKR(subtotal)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Link to="/cart" onClick={close} className="btn-outline">View Cart</Link>
                  <Link to="/checkout" onClick={close} className="btn-primary">Checkout</Link>
                </div>
              </footer>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(drawer, document.body);
}
