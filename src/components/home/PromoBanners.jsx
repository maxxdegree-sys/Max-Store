import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { promoBanners as FALLBACK } from '../../data/banners';
import { bannersPublicApi } from '../../api/client';

export default function PromoBanners() {
  const [banners, setBanners] = useState(FALLBACK);

  useEffect(() => {
    // Once the API responds, use exactly what it returns — including an empty
    // list, so admins can clear the row by deleting/hiding all promo banners.
    // FALLBACK stays only as the pre-load / offline default.
    bannersPublicApi('promo')
      .then((d) => { if (Array.isArray(d?.banners)) setBanners(d.banners); })
      .catch(() => {});
  }, []);

  if (!banners.length) return null;

  return (
    <section className="container-px py-10 sm:py-14">
      <div className="grid sm:grid-cols-3 gap-4">
        {banners.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
          >
            <Link to={p.href || '/shop'} className={`group relative block overflow-hidden rounded-2xl p-6 sm:p-7 h-44 sm:h-48 text-white bg-gradient-to-br ${p.color || 'from-brand-600 to-brand-800'}`}>
              {p.image && <img src={p.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30 group-hover:scale-110 transition" />}
              <div className="relative">
                <div className="text-xs font-bold uppercase tracking-widest opacity-80">{p.subtitle || p.eyebrow}</div>
                <h3 className="text-xl sm:text-2xl font-extrabold mt-1 max-w-[14ch] leading-tight">{p.title}</h3>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold underline underline-offset-4">
                  Explore <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
