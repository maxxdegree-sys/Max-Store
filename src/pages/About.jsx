import { Award, Users, Globe, ShieldCheck, Heart, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import SEO from '../components/seo/SEO';
import { selectAboutStats } from '../store/settingsSlice';

export default function About() {
  const stats = useSelector(selectAboutStats);
  return (
    <>
      <SEO title="About Us" description="Learn about Maxx - a premium online marketplace in Kharian, Pakistan." />
      <Breadcrumbs items={[{ label: 'About Us' }]} />

      <section className="relative overflow-hidden">
        <div className="container-px py-10 sm:py-16 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-brand-700">About Maxx</div>
            <h1 className="mt-2 text-3xl sm:text-5xl font-extrabold leading-tight text-balance">
              From Kharian, with love - quality you can trust.
            </h1>
            <p className="mt-4 text-ink-700 dark:text-ink-200 max-w-xl">
              Maxx began as a family-run business in Kharian,
              serving thousands of loyal customers across Punjab. Today we bring that same care online -
              curating premium kitchen, electronics, beauty and home essentials at honest prices, with fast
              cash-on-delivery across Pakistan.
            </p>
            <div className="mt-6 grid grid-cols-3 gap-4 max-w-md">
              {[
                { v: stats.customers || '50K+', l: 'Happy Customers' },
                { v: stats.products || '1.2K+', l: 'Products' },
                { v: stats.rating || '4.8', l: 'Avg. Rating' }
              ].map((s) => (
                <div key={s.l} className="card p-4 text-center">
                  <div className="text-2xl font-extrabold text-brand-700">{s.v}</div>
                  <div className="text-[11px] uppercase tracking-wider text-ink-500">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative aspect-square rounded-3xl overflow-hidden shadow-soft">
            <img loading="lazy" src="https://images.unsplash.com/photo-1583394838336-acd977736f90?w=1000&q=80&auto=format&fit=crop" alt="Maxx store" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-brand-700/10" />
          </div>
        </div>
      </section>

      <section className="container-px py-10 sm:py-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { i: Award, t: 'Premium Quality', d: 'We verify every product before it ships from our Kharian warehouse.' },
            { i: ShieldCheck, t: 'Honest Pricing', d: 'No hidden charges, no inflated MRPs. Just fair, transparent prices.' },
            { i: Users, t: 'Real Community', d: 'Thousands of shoppers sharing tips, reviews and honest feedback.' },
            { i: Heart, t: 'Customer Obsessed', d: '7-day no-questions returns and human-first support.' },
            { i: Globe, t: 'Pakistan-wide Reach', d: 'COD delivery to every district through trusted courier partners.' },
            { i: Target, t: 'Local + Imported', d: 'Best of Pakistani brands plus carefully sourced imported finds.' }
          ].map((c, i) => (
            <motion.div key={c.t} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }} className="card p-6">
              <span className="grid place-items-center w-11 h-11 rounded-xl bg-brand-50 text-brand-700"><c.i size={20} /></span>
              <h3 className="mt-3 font-bold">{c.t}</h3>
              <p className="text-sm text-ink-500 mt-1 leading-relaxed">{c.d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="container-px pb-16">
        <div className="rounded-3xl bg-brand-gradient text-white p-8 sm:p-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold">Shop with Maxx</h2>
          <p className="mt-2 text-white/90">Premium products delivered to your door with fast cash-on-delivery across Pakistan.</p>
          <a
            href="/shop"
            className="btn mt-5 bg-white text-brand-700 hover:bg-brand-50"
          >
            Browse Products
          </a>
        </div>
      </section>
    </>
  );
}
