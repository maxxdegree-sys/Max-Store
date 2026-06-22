import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Filter, SlidersHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react';
import ProductGrid from '../components/product/ProductGrid';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import SEO from '../components/seo/SEO';
import Loader from '../components/ui/Loader';
import { useSelector } from 'react-redux';
import { selectAllProducts } from '../store/productsSlice';
import { productsListApi } from '../api/client';
import { categories, categoryBySlug, categoryLabel } from '../data/categories';

const PAGE_SIZE = 48;

const SORTS = [
  { value: 'popular',    label: 'Most Popular' },
  { value: 'best-selling', label: 'Best Selling' },
  { value: 'newest',     label: 'Newest' },
  { value: 'price-asc',  label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating',     label: 'Top Rated' }
];

export default function Shop() {
  const { slug, subslug } = useParams();
  const [params, setParams] = useSearchParams();
  const q   = params.get('q')?.toLowerCase() || '';
  const tag = params.get('tag') || '';
  const sale = params.get('sale') || '';
  const category = slug || params.get('category') || '';
  const subcategory = subslug || params.get('subcategory') || '';

  const sort = params.get('sort') || 'popular';
  const [priceMax, setPriceMax] = useState(null);
  const [brands, setBrands] = useState([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [gridProducts, setGridProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const catalog = useSelector(selectAllProducts);

  useEffect(() => { setShowMobileFilters(false); setPage(1); }, [slug, subslug, q, tag, sale, category, subcategory, sort]);

  const allBrands = useMemo(() => [...new Set(catalog.map((p) => p.brand))].filter(Boolean), [catalog]);

  const maxPrice = useMemo(() => {
    const top = catalog.reduce((m, p) => Math.max(m, Number(p.price) || 0), 0);
    return Math.max(1000, Math.ceil(top / 500) * 500);
  }, [catalog]);
  const cap = priceMax == null ? maxPrice : Math.min(priceMax, maxPrice);

  const catCounts = useMemo(() => {
    const m = {};
    catalog.forEach((p) => { if (p.category) m[p.category] = (m[p.category] || 0) + 1; });
    return m;
  }, [catalog]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const apiParams = {
      page,
      limit: PAGE_SIZE,
      sort,
      ...(category && { category }),
      ...(subcategory && { subcategory }),
      ...(tag && { tag }),
      ...(sale && { sale }),
      ...(q && { q }),
      ...(cap < maxPrice && { maxPrice: String(cap) }),
      ...(brands.length && { brands: brands.join(',') })
    };
    productsListApi(apiParams)
      .then((d) => {
        if (cancelled) return;
        setGridProducts(d?.products || []);
        setTotal(d?.total ?? 0);
      })
      .catch(() => { if (!cancelled) { setGridProducts([]); setTotal(0); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, category, subcategory, tag, sale, q, sort, cap, maxPrice, brands]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentCat = category ? categoryBySlug(category) : null;
  const currentSub = subcategory && currentCat ? currentCat.subcategories?.find((s) => s.slug === subcategory) : null;
  const title = currentSub?.name || currentCat?.name || (q ? `Search: "${q}"` : tag ? `Tag: ${tag}` : 'All Products');

  return (
    <>
      <SEO
        title={title}
        description={`Shop ${title} at Maxx. ${total} products available.`}
        url={`https://alrafiq.pk/shop${slug ? `/${slug}` : ''}`}
      />
      <Breadcrumbs items={[
        { to: '/shop', label: 'Shop' },
        ...(currentCat ? [{ to: `/category/${currentCat.slug}`, label: currentCat.name }] : []),
        ...(currentSub ? [{ label: currentSub.name }] : [])
      ]} />
      <div className="container-px pb-12">
        <div className="flex items-end justify-between gap-3 mb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{title}</h1>
            <p className="text-sm text-ink-500">{total} products{currentCat ? ` in ${categoryLabel(category, subcategory)}` : ''}</p>
            {currentCat?.subcategories?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                <a
                  href={`/category/${currentCat.slug}`}
                  className={`badge ${!subcategory ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-200' : 'bg-ink-100 text-ink-700'}`}
                >
                  All {currentCat.name}
                </a>
                {currentCat.subcategories.map((s) => (
                  <a
                    key={s.slug}
                    href={`/category/${currentCat.slug}/${s.slug}`}
                    className={`badge ${subcategory === s.slug ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-200' : 'bg-ink-100 text-ink-700 hover:bg-brand-50'}`}
                  >
                    {s.name}
                  </a>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMobileFilters(true)}
              className="lg:hidden btn-outline !py-2 !px-3 text-xs"
            >
              <Filter size={14} /> Filters
            </button>
            <select
              value={sort}
              onChange={(e) => {
                const next = new URLSearchParams(params);
                const v = e.target.value;
                if (v === 'popular') next.delete('sort');
                else next.set('sort', v);
                setParams(next);
              }}
              className="input !py-2 !px-3 text-sm w-auto"
            >
              {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        <div className="grid lg:grid-cols-[260px_1fr] gap-6">
          <aside className={`lg:block ${showMobileFilters ? 'fixed inset-0 z-50 lg:static lg:z-auto' : 'hidden'}`}>
            <div className={`lg:sticky lg:top-24 ${showMobileFilters ? 'absolute right-0 top-0 h-full w-[88%] max-w-sm bg-white dark:bg-ink-900 shadow-2xl overflow-y-auto p-5' : ''}`}>
              {showMobileFilters && (
                <div className="flex items-center justify-between mb-4 lg:hidden">
                  <h3 className="font-bold flex items-center gap-2"><SlidersHorizontal size={18} /> Filters</h3>
                  <button onClick={() => setShowMobileFilters(false)} className="btn-ghost !p-2"><X /></button>
                </div>
              )}
              <div className="card p-5 space-y-6">
                <div>
                  <h4 className="font-bold text-sm mb-3">Categories</h4>
                  <ul className="space-y-1.5">
                    {categories.map((c) => (
                      <li key={c.id}>
                        <button
                          onClick={() => setParams({ ...(category && { }), category: c.slug })}
                          className={`flex items-center justify-between w-full px-2 py-1.5 rounded-lg text-sm ${category === c.slug ? 'bg-brand-50 text-brand-700 font-semibold' : 'hover:bg-ink-100 dark:hover:bg-white/5'}`}
                        >
                          <span>{c.icon} {c.name}</span>
                          <span className="text-xs text-ink-500">{catCounts[c.slug] ?? 0}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-sm mb-3">Price (max)</h4>
                  <input
                    type="range" min="500" max={maxPrice} step="500"
                    value={cap} onChange={(e) => setPriceMax(+e.target.value)}
                    className="w-full accent-brand-600"
                  />
                  <div className="text-xs text-ink-500 mt-1">Up to Rs. {cap.toLocaleString()}</div>
                </div>

                <div>
                  <h4 className="font-bold text-sm mb-3">Brands</h4>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {allBrands.map((b) => (
                      <label key={b} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={brands.includes(b)}
                          onChange={(e) => setBrands((bs) => e.target.checked ? [...bs, b] : bs.filter((x) => x !== b))}
                          className="accent-brand-600"
                        />
                        {b}
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => { setBrands([]); setPriceMax(null); setParams({}); }}
                  className="btn-outline w-full text-xs"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </aside>

          <div>
            {loading ? <Loader /> : (
              <>
                <ProductGrid products={gridProducts} cols="sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4" />
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 mt-8">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="btn-outline !py-2 !px-3 disabled:opacity-40"
                    >
                      <ChevronLeft size={16} /> Prev
                    </button>
                    <span className="text-sm text-ink-600">Page {page} of {totalPages}</span>
                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="btn-outline !py-2 !px-3 disabled:opacity-40"
                    >
                      Next <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
