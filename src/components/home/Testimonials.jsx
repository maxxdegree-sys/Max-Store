import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { Quote } from 'lucide-react';
import SectionHeader from '../ui/SectionHeader';
import Rating from '../ui/Rating';
import { selectTestimonials } from '../../store/settingsSlice';

export default function Testimonials() {
  const testimonials = useSelector(selectTestimonials);
  if (!testimonials.length) return null;
  return (
    <section className="container-px py-12 sm:py-16">
      <SectionHeader
        eyebrow="What customers say"
        title="Trusted by thousands across Pakistan"
        subtitle="Real reviews from real shoppers."
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {testimonials.slice(0, 6).map((t, i) => (
          <motion.figure
            key={t.id ?? i}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="card p-5 relative"
          >
            <Quote className="absolute top-4 right-4 text-brand-100 dark:text-brand-900/40" size={36} />
            <Rating value={t.rating} />
            <p className="mt-3 text-sm leading-relaxed text-ink-700 dark:text-ink-200">"{t.text}"</p>
            <figcaption className="mt-4 flex items-center gap-3">
              <img src={t.avatar || `https://i.pravatar.cc/100?u=${encodeURIComponent(t.name || i)}`} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
              <div>
                <div className="font-semibold text-sm">{t.name}</div>
                <div className="text-xs text-ink-500">{t.city}, Pakistan</div>
              </div>
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </section>
  );
}
