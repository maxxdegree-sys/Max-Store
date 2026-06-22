import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { heroBanners as FALLBACK } from '../../data/banners';
import { bannersPublicApi } from '../../api/client';

export default function HeroSlider() {
  const [banners, setBanners] = useState(FALLBACK);
  const [i, setI] = useState(0);

  useEffect(() => {
    bannersPublicApi('hero')
      .then((d) => { if (Array.isArray(d?.banners) && d.banners.length) setBanners(d.banners); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!banners.length) return;
    setI(0);
    const t = setInterval(() => setI((x) => (x + 1) % banners.length), 5500);
    return () => clearInterval(t);
  }, [banners]);

  const banner = banners[i] || banners[0];
  if (!banner) return null;

  const prev = () => setI((x) => (x - 1 + banners.length) % banners.length);
  const next = () => setI((x) => (x + 1) % banners.length);

  return (
    <section className="container-px pt-4 sm:pt-6">
      <div className="relative overflow-hidden rounded-3xl bg-brand-50 dark:bg-ink-900/60 ring-1 ring-brand-100 dark:ring-white/10">
        <AnimatePresence mode="wait">
          <motion.div
            key={banner.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="relative grid md:grid-cols-2 min-h-[320px] sm:min-h-[420px] lg:min-h-[480px]"
          >
            {/* Content */}
            <div className="relative z-10 p-6 sm:p-10 lg:p-14 flex flex-col justify-center">
              <motion.div
                initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}
                className="inline-flex w-fit items-center gap-2 rounded-full bg-white/80 dark:bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-700"
              >
                <span className="w-2 h-2 bg-brand-600 rounded-full animate-pulse" />
                {banner.eyebrow}
              </motion.div>
              <motion.h1
                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}
                className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-balance leading-tight"
              >
                {banner.title}
              </motion.h1>
              <motion.p
                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                className="mt-3 text-sm sm:text-base text-ink-700 dark:text-ink-300 max-w-md"
              >
                {banner.subtitle}
              </motion.p>
              <motion.div
                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }}
                className="mt-6 flex gap-3"
              >
                <Link to={banner.href || '/shop'} className="btn-primary text-base !px-6 !py-3">
                  {banner.cta || 'Shop Now'} <ArrowRight size={18} />
                </Link>
                <Link to="/shop" className="btn-outline text-base !px-6 !py-3">Browse All</Link>
              </motion.div>
            </div>

            {/* Image */}
            <div className="relative">
              <img
                src={banner.image}
                alt={banner.title}
                className="absolute inset-0 h-full w-full object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/60 to-transparent dark:from-ink-900 dark:via-ink-900/40 md:hidden" />
            </div>
            {banner.badge && (
              <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
                <span className="rounded-full bg-rose-600 text-white text-[11px] font-bold px-3 py-1 shadow-lg animate-float inline-block">
                  {banner.badge}
                </span>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Controls */}
        <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 grid place-items-center w-10 h-10 rounded-full glass hover:bg-white" aria-label="Previous">
          <ChevronLeft />
        </button>
        <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 grid place-items-center w-10 h-10 rounded-full glass hover:bg-white" aria-label="Next">
          <ChevronRight />
        </button>

        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setI(idx)}
              className={`h-2 rounded-full transition-all ${idx === i ? 'w-7 bg-brand-600' : 'w-2 bg-white/70'}`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
