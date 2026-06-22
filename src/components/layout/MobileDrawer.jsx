import { useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { categories } from '../../data/categories';
import Logo from '../ui/Logo';
import DeliveryLocationButton from '../location/DeliveryLocationButton';

export default function MobileDrawer({ open, onClose, navLinks }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={{ type: 'tween' }}
          className="fixed inset-0 z-50 lg:hidden"
        >
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <div className="absolute left-0 top-0 h-full w-[84%] max-w-sm bg-white dark:bg-ink-900 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-ink-100 dark:border-white/10">
              <Link to="/" onClick={onClose} className="flex items-center gap-2">
                <Logo className="h-9 w-9" />
              </Link>
              <button type="button" onClick={onClose} aria-label="Close menu" className="btn-ghost !p-2"><X size={22} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <div className="mb-3 p-3 rounded-xl bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800/30">
                <DeliveryLocationButton />
              </div>
              {navLinks.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.to === '/'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `block rounded-xl px-3 py-2.5 text-sm font-semibold ${isActive ? 'bg-brand-50 text-brand-700' : 'hover:bg-ink-100 dark:hover:bg-white/5'}`
                  }
                >
                  {l.label}
                </NavLink>
              ))}

              <div className="pt-3 mt-3 border-t border-ink-100 dark:border-white/10">
                <div className="text-[11px] uppercase tracking-wider font-bold text-ink-500 px-3 mb-2">
                  Shop by category
                </div>
                {categories.map((c) => (
                  <Link
                    key={c.id}
                    to={`/category/${c.slug}`}
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-ink-100 dark:hover:bg-white/5"
                  >
                    <span className="text-xl">{c.icon}</span>
                    <span className="text-sm font-medium">{c.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-ink-100 dark:border-white/10 grid grid-cols-2 gap-2">
              <Link to="/login" onClick={onClose} className="btn-outline">Login</Link>
              <Link to="/register" onClick={onClose} className="btn-primary">Sign Up</Link>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
