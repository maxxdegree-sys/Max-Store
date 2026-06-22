import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Mail, HelpCircle } from 'lucide-react';
import { faqGroups, faqSchema } from '../data/faqs';
import { BUSINESS } from '../utils/format';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import SEO from '../components/seo/SEO';

export default function Faq() {
  const [open, setOpen] = useState({}); // map question key -> bool

  const toggle = (key) => setOpen((o) => ({ ...o, [key]: !o[key] }));

  return (
    <>
      <SEO
        title="Frequently Asked Questions"
        description="Common questions about ordering, delivery, payment, returns and warranty at Maxx."
        url="https://alrafiq.pk/faq"
        schema={faqSchema}
      />
      <Breadcrumbs items={[{ label: 'FAQ' }]} />

      <div className="container-px pb-14">
        <header className="text-center max-w-2xl mx-auto py-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 text-brand-700 px-3 py-1 text-xs font-bold uppercase tracking-wider">
            <HelpCircle size={14} /> Help Centre
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold mt-3">Frequently Asked Questions</h1>
          <p className="mt-2 text-ink-500">Everything you need to know about ordering with Maxx.</p>
        </header>

        <div className="max-w-3xl mx-auto space-y-6">
          {faqGroups.map((g) => (
            <section key={g.name} className="card overflow-hidden">
              <h2 className="font-bold text-base px-5 py-3 border-b border-ink-100 dark:border-white/10 bg-brand-50/50 dark:bg-brand-900/10">
                {g.name}
              </h2>
              <ul className="divide-y divide-ink-100 dark:divide-white/10">
                {g.items.map((it, i) => {
                  const key = `${g.name}-${i}`;
                  return (
                    <li key={key}>
                      <button
                        onClick={() => toggle(key)}
                        className="w-full text-left flex items-center justify-between gap-4 px-5 py-4 hover:bg-ink-100/40 dark:hover:bg-white/5"
                      >
                        <span className="font-semibold text-sm sm:text-base">{it.q}</span>
                        <ChevronDown
                          size={18}
                          className={`shrink-0 text-ink-500 transition-transform ${open[key] ? 'rotate-180' : ''}`}
                        />
                      </button>
                      {open[key] && (
                        <div className="px-5 pb-4 text-sm text-ink-700 dark:text-ink-200 leading-relaxed">
                          {it.a}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>

        <div className="max-w-3xl mx-auto mt-8 rounded-2xl bg-brand-gradient text-white p-6 text-center">
          <h3 className="font-extrabold text-xl">Still have a question?</h3>
          <p className="text-sm text-white/90 mt-1">Our team replies within 24 hours.</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <a href={`mailto:${BUSINESS.email}`} className="btn bg-white text-brand-700 hover:bg-brand-50">
              <Mail size={14} /> Email us
            </a>
            <Link to="/complaint" className="btn bg-ink-900 text-white hover:bg-ink-700">File a complaint</Link>
            <Link to="/contact" className="btn-outline bg-white/10 text-white border-white/40 hover:bg-white/20">Contact form</Link>
          </div>
        </div>
      </div>
    </>
  );
}
