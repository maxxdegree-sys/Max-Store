import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Tag as TagIcon, Calendar, Clock, ArrowRight } from 'lucide-react';
import { blogPublicApi } from '../api/client';
import { posts as SEED } from '../data/blog';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import SEO from '../components/seo/SEO';

function norm(p) {
  return {
    ...p,
    excerpt: p.excerpt || p.summary || '',
    readTime: p.readTime || p.read_time || 5,
    tags: Array.isArray(p.tags) ? p.tags : [],
    keywords: p.keywords || ''
  };
}

export default function Blog() {
  const [posts, setPosts] = useState(SEED.map(norm));
  const [q, setQ] = useState('');
  const [tag, setTag] = useState('');

  useEffect(() => {
    blogPublicApi({ limit: 50 })
      .then((d) => { if (Array.isArray(d?.posts) && d.posts.length) setPosts(d.posts.map(norm)); })
      .catch(() => {});
  }, []);

  const allTags = useMemo(() => [...new Set(posts.flatMap((p) => p.tags || []))], [posts]);

  const list = useMemo(() => {
    let l = [...posts];
    if (tag) l = l.filter((p) => p.tags.includes(tag));
    if (q) {
      const s = q.toLowerCase();
      l = l.filter((p) =>
        (p.title + (p.excerpt || '') + (p.keywords || '') + (p.tags || []).join(' ')).toLowerCase().includes(s)
      );
    }
    return l.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  }, [q, tag, posts]);

  const featured = posts[0];

  return (
    <>
      <SEO
        title="Blog - Buying Guides &amp; Tips"
        description="Practical buying guides, product care tips, and shopping advice from Maxx in Kharian, Pakistan."
        url="https://alrafiq.pk/blog"
      />
      <Breadcrumbs items={[{ label: 'Blog' }]} />
      <div className="container-px pb-14">
        <header className="text-center max-w-2xl mx-auto py-6">
          <div className="text-[11px] font-bold uppercase tracking-widest text-brand-700">Maxx Blog</div>
          <h1 className="text-3xl sm:text-4xl font-extrabold mt-2 leading-tight">Buying guides, tips and stories from Pakistan</h1>
          <p className="mt-3 text-ink-500">Honest, practical writing - no clickbait. Help you buy smarter and use what you bought longer.</p>
        </header>

        {/* Featured */}
        {!q && !tag && featured && (
          <Link to={`/blog/${featured.slug}`} className="block card overflow-hidden group hover:-translate-y-0.5 transition mb-8">
            <div className="grid md:grid-cols-2 gap-0">
              <div className="relative aspect-[16/10] md:aspect-auto overflow-hidden bg-ink-100">
                <img src={featured.cover} alt={featured.title} className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition" loading="lazy" />
              </div>
              <div className="p-6 sm:p-8 flex flex-col justify-center">
                <span className="badge bg-brand-50 text-brand-700 w-fit">Featured</span>
                <h2 className="font-extrabold text-2xl mt-3 leading-tight">{featured.title}</h2>
                <p className="text-ink-500 mt-2">{featured.excerpt}</p>
                <div className="flex items-center gap-3 text-xs text-ink-500 mt-4">
                  <span className="inline-flex items-center gap-1"><Calendar size={12} /> {featured.date}</span>
                  <span className="inline-flex items-center gap-1"><Clock size={12} /> {featured.readTime} min read</span>
                </div>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 mt-4">
                  Read article <ArrowRight size={14} />
                </span>
              </div>
            </div>
          </Link>
        )}

        {/* Search + tags */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search articles..." className="input pl-9 !py-2 !text-sm" />
          </div>
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setTag('')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${!tag ? 'bg-brand-500 text-white' : 'bg-ink-100 dark:bg-white/5'}`}
            >
              All
            </button>
            {allTags.map((t) => (
              <button
                key={t}
                onClick={() => setTag(t === tag ? '' : t)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap inline-flex items-center gap-1 ${tag === t ? 'bg-brand-500 text-white' : 'bg-ink-100 dark:bg-white/5'}`}
              >
                <TagIcon size={11} /> {t}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {list.length === 0 ? (
          <div className="card p-10 text-center text-ink-500 text-sm">No articles match your filter.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {list.map((p) => (
              <Link key={p.slug} to={`/blog/${p.slug}`} className="card overflow-hidden group hover:-translate-y-1 transition">
                <div className="aspect-[16/10] overflow-hidden bg-ink-100">
                  <img src={p.cover} alt={p.title} className="h-full w-full object-cover group-hover:scale-105 transition" loading="lazy" />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 text-xs text-ink-500">
                    <span className="inline-flex items-center gap-1"><Calendar size={11} /> {p.date}</span>
                    <span>-</span>
                    <span className="inline-flex items-center gap-1"><Clock size={11} /> {p.readTime} min</span>
                  </div>
                  <h3 className="font-bold mt-2 leading-snug line-clamp-2 group-hover:text-brand-700">{p.title}</h3>
                  <p className="text-sm text-ink-500 mt-1 line-clamp-2">{p.excerpt}</p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {(p.tags || []).slice(0, 3).map((t) => (
                      <span key={t} className="badge bg-ink-100 text-ink-700">{t}</span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
