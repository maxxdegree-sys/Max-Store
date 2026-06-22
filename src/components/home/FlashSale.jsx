import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Flame, ArrowRight } from 'lucide-react';
import ProductGrid from '../product/ProductGrid';
import CountdownDigits from './CountdownDigits';
import { useSelector } from 'react-redux';
import { selectFlashSale } from '../../store/productsSlice';
import { selectFlashSaleConfig } from '../../store/settingsSlice';

export default function FlashSale() {
  const cfg = useSelector(selectFlashSaleConfig);
  const items = useSelector(selectFlashSale);
  const [fallback] = useState(() => Date.now() + 9 * 3600 * 1000);
  const configuredEnd = cfg.endsAt ? new Date(cfg.endsAt).getTime() : NaN;
  const target = Number.isFinite(configuredEnd) ? configuredEnd : fallback;
  const ended = cfg.endsAt && Number.isFinite(configuredEnd) && configuredEnd <= Date.now();

  if (cfg.enabled === false || ended || !items.length) return null;

  return (
    <section className="container-px py-10 sm:py-14">
      <div className="rounded-3xl bg-gradient-to-br from-rose-50 via-amber-50 to-brand-50 dark:from-rose-900/20 dark:via-amber-900/20 dark:to-brand-900/20 ring-1 ring-rose-100 dark:ring-white/10 p-5 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="grid place-items-center w-12 h-12 rounded-2xl bg-rose-600 text-white shadow-glow">
              <Flame size={22} />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-rose-600">Limited Time</div>
              <h2 className="text-2xl sm:text-3xl font-extrabold">{cfg.title || '⚡ Flash Sale Live Now'}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-ink-600 font-medium">Ends in</span>
            <CountdownDigits targetMs={target} />
            <Link to="/shop?sale=flash" className="ml-auto sm:ml-3 hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-rose-700">View All <ArrowRight size={14} /></Link>
          </div>
        </div>
        <ProductGrid products={items.slice(0, 5)} cols="sm:grid-cols-3 lg:grid-cols-5" />
      </div>
    </section>
  );
}
