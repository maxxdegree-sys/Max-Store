import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search, ShoppingBag, Heart, User, Menu, X, Sun, Moon, ChevronDown
} from 'lucide-react';
import { categories } from '../../data/categories';
import { selectAllProducts, selectCategoryCounts } from '../../store/productsSlice';
import { selectCartCount } from '../../store/cartSlice';
import { selectWishlistCount } from '../../store/wishlistSlice';
import { selectUser, selectIsAdmin } from '../../store/authSlice';
import { toggleCartDrawer } from '../../store/uiSlice';
import { getCustomerToken, getToken } from '../../api/client';
import { useTheme } from '../../context/ThemeContext';
import { imageThumbUrl } from '../../utils/format';
import Logo from '../ui/Logo';
import MobileDrawer from './MobileDrawer';
import DeliveryLocationButton from '../location/DeliveryLocationButton';

const navLinks = [
  { to: '/',           label: 'Home' },
  { to: '/shop',       label: 'Shop' },
  { to: '/categories', label: 'Categories' },
  { to: '/blog',       label: 'Blog' },
  { to: '/faq',        label: 'FAQ' },
  { to: '/about',      label: 'About' },
  { to: '/contact',    label: 'Contact' }
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const cartCount = useSelector(selectCartCount);
  const wishCount = useSelector(selectWishlistCount);
  const user = useSelector(selectUser);
  const isAdmin = useSelector(selectIsAdmin);
  const products = useSelector(selectAllProducts);
  const catCounts = useSelector(selectCategoryCounts);
  const { theme, toggle } = useTheme();

  const accountHref = isAdmin && getToken()
    ? '/admin'
    : (getCustomerToken() || user?.kind === 'customer')
      ? '/dashboard'
      : '/login';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!catOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setCatOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [catOpen]);

  // Close the categories dropdown on any navigation (covers clicking a category,
  // browser back/forward, or re-clicking the current route).
  useEffect(() => { setCatOpen(false); }, [location.pathname, location.search]);

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return products
      .filter((p) => p.title?.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q))
      .slice(0, 6);
  }, [query, products]);

  const submitSearch = (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    navigate(`/shop?q=${encodeURIComponent(query)}`);
    setSearchOpen(false);
    setMobileOpen(false);
  };

  const headerClass = scrolled
    ? 'glass shadow-soft'
    : 'bg-white dark:bg-ink-900 border-b border-ink-100 dark:border-white/10';

  return (
    <header className={`sticky top-0 z-40 transition-all relative ${headerClass}`}>
      <div className="container-px">
        <div className="flex h-16 items-center gap-3 lg:gap-6">
          <button
            className="lg:hidden btn-ghost !p-2"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>

          <Link to="/" className="flex items-center gap-2 shrink-0 min-w-0">
            <Logo className="h-10 w-10 shrink-0" />
          </Link>

          <div className="hidden lg:block">
            <button
              onClick={() => setCatOpen((o) => !o)}
              className={`btn-ghost gap-1 !py-2 !px-3 ${catOpen ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30' : ''}`}
              aria-expanded={catOpen}
              aria-haspopup="true"
            >
              <Menu size={18} /> Categories <ChevronDown size={16} className={`transition-transform ${catOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <form onSubmit={submitSearch} className="hidden md:block relative flex-1 max-w-xl mx-2">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for products, brands and categories..."
              className="input pl-9 pr-24"
              onFocus={() => setSearchOpen(true)}
              onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
            />
            <button type="submit" className="absolute right-1.5 top-1.5 btn-primary !py-1.5 !px-4 text-xs">
              Search
            </button>
            <AnimatePresence>
              {searchOpen && suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="absolute left-0 right-0 top-full mt-2 rounded-2xl bg-white dark:bg-ink-900 shadow-soft border border-ink-100 dark:border-white/10 overflow-hidden"
                >
                  {suggestions.map((p) => (
                    <Link
                      key={p.id}
                      to={`/product/${p.slug}`}
                      onMouseDown={(e) => e.preventDefault()}
                      className="flex items-center gap-3 p-3 hover:bg-ink-100 dark:hover:bg-ink-700/50"
                    >
                      <img
                        loading="lazy"
                        src={imageThumbUrl(p.images?.[0]) || 'https://placehold.co/80x80?text=No+Image'}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover"
                        onError={(e) => {
                          const full = p.images?.[0];
                          if (full && !e.currentTarget.dataset.fallback) {
                            e.currentTarget.dataset.fallback = '1';
                            e.currentTarget.src = full;
                          }
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{p.title}</div>
                        <div className="text-xs text-ink-500">{p.brand}</div>
                      </div>
                      <div className="text-sm font-bold text-brand-700">Rs {(Number(p.price) || 0).toLocaleString()}</div>
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <button onClick={toggle} className="btn-ghost !p-2" aria-label="Toggle theme">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link to="/wishlist" className="btn-ghost !p-2 relative" aria-label="Wishlist">
              <Heart size={20} />
              {wishCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-600 text-white text-[10px] min-w-[18px] h-[18px] rounded-full grid place-items-center font-bold">
                  {wishCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => dispatch(toggleCartDrawer())}
              className="btn-ghost !p-2 relative"
              aria-label="Cart"
            >
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-600 text-white text-[10px] min-w-[18px] h-[18px] rounded-full grid place-items-center font-bold">
                  {cartCount}
                </span>
              )}
            </button>
            <Link to={accountHref} className="hidden sm:inline-flex btn-ghost !p-2" aria-label="Account">
              <User size={20} />
            </Link>
          </div>
        </div>

        <form onSubmit={submitSearch} className="md:hidden pb-2 -mt-1">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              className="input pl-9 pr-4"
            />
          </div>
        </form>
        <div className="md:hidden pb-3 flex justify-end">
          <DeliveryLocationButton className="text-xs text-ink-500" />
        </div>

        <nav className="hidden lg:flex items-center gap-6 h-11 border-t border-ink-100 dark:border-white/10">
          {navLinks.filter((l) => l.to !== '/categories').map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                `text-sm font-medium link-underline ${isActive ? 'text-brand-700' : 'text-ink-700 dark:text-ink-100'}`
              }
            >
              {l.label}
            </NavLink>
          ))}
          <div className="ml-auto hidden lg:flex items-center">
            <DeliveryLocationButton className="text-xs text-ink-500 hover:text-brand-700 max-w-[200px]" />
          </div>
        </nav>
      </div>

      <AnimatePresence>
        {catOpen && (
          <>
            <button
              type="button"
              aria-label="Close categories menu"
              className="fixed inset-0 z-40 bg-black/20 lg:bg-transparent"
              onClick={() => setCatOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute left-0 right-0 top-full z-50 border-t border-ink-100 dark:border-white/10 bg-white dark:bg-ink-900 shadow-soft"
            >
              <div className="container-px py-4">
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-1 max-h-[min(70vh,520px)] overflow-y-auto">
                  {categories.map((c) => (
                    <Link
                      key={c.id}
                      to={`/category/${c.slug}`}
                      onClick={() => setCatOpen(false)}
                      className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-brand-50 dark:hover:bg-brand-900/30 transition"
                    >
                      <span className="grid place-items-center w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-900/40 text-xl shrink-0">
                        {c.icon}
                      </span>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm truncate">{c.name}</div>
                        <div className="text-xs text-ink-500">{catCounts[c.slug] ?? 0} products</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <MobileDrawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        navLinks={navLinks}
      />
    </header>
  );
}
