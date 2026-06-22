import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import SEO from '../components/seo/SEO';
import { categories } from '../data/categories';
import { selectCategoryCounts } from '../store/productsSlice';

export default function Categories() {
  const counts = useSelector(selectCategoryCounts);
  return (
    <>
      <SEO title="All Categories" description="Shop by category at Maxx — 23 departments with sub-categories." />
      <Breadcrumbs items={[{ label: 'Categories' }]} />
      <div className="container-px py-6 pb-14">
        <h1 className="text-3xl font-extrabold mb-2">Shop by Category</h1>
        <p className="text-ink-500 mb-8">23 departments — electronics, home, fashion, groceries and more.</p>
        <div className="grid gap-4 md:grid-cols-2">
          {categories.map((c) => (
            <div key={c.id} className="card overflow-hidden">
              <Link to={`/category/${c.slug}`} className="flex gap-4 p-4 hover:bg-ink-50 dark:hover:bg-white/5 transition">
                <img src={c.image} alt="" className="w-20 h-20 rounded-xl object-cover shrink-0" loading="lazy" />
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-lg flex items-center gap-2"><span>{c.icon}</span> {c.name}</div>
                  <div className="text-xs text-ink-500 mt-0.5">{counts[c.slug] ?? 0} products</div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(c.subcategories || []).slice(0, 5).map((s) => (
                      <Link key={s.slug} to={`/category/${c.slug}/${s.slug}`} onClick={(e) => e.stopPropagation()} className="text-[11px] px-2 py-0.5 rounded-full bg-ink-100 dark:bg-white/10 text-ink-600 hover:bg-brand-50 hover:text-brand-700">
                        {s.name}
                      </Link>
                    ))}
                    {(c.subcategories || []).length > 5 && <span className="text-[11px] text-ink-500">+{c.subcategories.length - 5} more</span>}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
