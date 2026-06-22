import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { categories } from '../../data/categories';
import { selectCategoryCounts } from '../../store/productsSlice';
import SectionHeader from '../ui/SectionHeader';

export default function CategoryGrid() {
  const counts = useSelector(selectCategoryCounts);
  return (
    <section className="container-px py-10 sm:py-14">
      <SectionHeader
        eyebrow="Shop by Category"
        title="Find what you love, fast"
        subtitle="Curated picks across every department of your home & lifestyle."
        viewAll="/categories"
      />
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        {categories.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.04 }}
          >
            <Link
              to={`/category/${c.slug}`}
              className="group block card hover:-translate-y-1 transition will-change-transform"
            >
              <div className="relative aspect-square overflow-hidden rounded-t-2xl bg-brand-50 dark:bg-brand-900/30">
                <img
                  loading="lazy"
                  src={c.image}
                  alt={c.name}
                  className="absolute inset-0 h-full w-full object-cover opacity-90 group-hover:scale-110 transition"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent" />
                <div className="absolute top-2 left-2 rounded-lg bg-white/90 text-lg w-9 h-9 grid place-items-center">
                  {c.icon}
                </div>
              </div>
              <div className="p-2.5 sm:p-3">
                <div className="font-semibold text-xs sm:text-sm line-clamp-1">{c.name}</div>
                <div className="text-[11px] text-ink-500">{counts[c.slug] ?? 0} item{(counts[c.slug] ?? 0) === 1 ? '' : 's'}</div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
