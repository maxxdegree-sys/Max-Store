import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Calendar, Clock, User, ArrowLeft, Share2, ArrowRight, Tag as TagIcon } from 'lucide-react';
import { blogPostPublicApi, blogPublicApi } from '../api/client';
import { posts as SEED } from '../data/blog';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import SEO from '../components/seo/SEO';
import NotFound from './NotFound';

function norm(p) {
  return p ? {
    ...p,
    excerpt: p.excerpt || p.summary || '',
    readTime: p.readTime || p.read_time || 5,
    tags: Array.isArray(p.tags) ? p.tags : [],
    keywords: p.keywords || ''
  } : null;
}

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(() => norm(SEED.find((p) => p.slug === slug) || null));
  const [allPosts, setAllPosts] = useState(SEED);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    blogPostPublicApi(slug)
      .then((d) => setPost(norm(d.post)))
      .catch((err) => { if (err.status === 404) setNotFound(true); });
  }, [slug]);

  useEffect(() => {
    blogPublicApi({ limit: 20 })
      .then((d) => { if (Array.isArray(d?.posts)) setAllPosts(d.posts.map(norm)); })
      .catch(() => {});
  }, []);

  if (notFound && !post) return <NotFound />;
  if (!post) return null;

  const related = allPosts
    .filter((p) => p && p.slug !== post.slug && (p.tags || []).some((t) => (post.tags || []).includes(t)))
    .slice(0, 3);

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: post.cover,
    datePublished: post.date,
    author: { '@type': 'Organization', name: post.author },
    publisher: {
      '@type': 'Organization',
      name: 'Maxx',
      logo: { '@type': 'ImageObject', url: 'https://alrafiq.pk/logo.png' }
    },
    keywords: post.keywords,
    articleBody: (post.sections || []).map((s) => `${s.h}. ${s.p}`).join(' ')
  };

  const share = () => {
    if (navigator.share) navigator.share({ title: post.title, url: window.location.href });
    else { navigator.clipboard?.writeText(window.location.href); }
  };

  return (
    <>
      <SEO
        title={post.title}
        description={post.excerpt}
        image={post.cover}
        url={`https://alrafiq.pk/blog/${post.slug}`}
        schema={schema}
      />
      <Breadcrumbs items={[{ to: '/blog', label: 'Blog' }, { label: post.title }]} />

      <article className="container-px pb-10 max-w-3xl mx-auto">
        <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-brand-700 font-semibold mb-4">
          <ArrowLeft size={14} /> Back to all articles
        </Link>

        <header>
          <div className="flex flex-wrap gap-1 mb-3">
            {(post.tags || []).map((t) => (
              <Link key={t} to={`/blog?tag=${t}`} className="badge bg-brand-50 text-brand-700 inline-flex items-center gap-1">
                <TagIcon size={11} /> {t}
              </Link>
            ))}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight">{post.title}</h1>
          <p className="text-ink-500 mt-3 text-lg">{post.excerpt}</p>
          <div className="mt-4 flex items-center gap-4 text-sm text-ink-500 flex-wrap">
            <span className="inline-flex items-center gap-1.5"><User size={13} /> {post.author}</span>
            <span className="inline-flex items-center gap-1.5"><Calendar size={13} /> {post.date}</span>
            <span className="inline-flex items-center gap-1.5"><Clock size={13} /> {post.readTime} min read</span>
            <button onClick={share} className="ml-auto btn-ghost !p-2"><Share2 size={14} /></button>
          </div>
        </header>

        <img src={post.cover} alt={post.title} className="mt-6 rounded-2xl w-full object-cover aspect-[16/9]" loading="eager" />

        <div className="mt-8 space-y-6">
          {(post.sections || []).map((s, i) => (
            <section key={i}>
              <h2 className="text-xl font-extrabold leading-snug">{s.h}</h2>
              <p className="mt-2 text-ink-700 dark:text-ink-200 leading-relaxed whitespace-pre-line">{s.p}</p>
            </section>
          ))}
        </div>

        {post.faqs && post.faqs.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl font-extrabold">Frequently asked questions</h2>
            <div className="mt-3 space-y-3">
              {post.faqs.map((f, i) => (
                <div key={i} className="card p-4">
                  <div className="font-semibold">{f.question}</div>
                  <p className="text-sm text-ink-600 dark:text-ink-300 mt-1">{f.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-10 rounded-2xl bg-brand-gradient text-white p-6 text-center">
          <h3 className="text-xl font-extrabold">Shop these picks at Maxx</h3>
          <p className="text-sm text-white/90 mt-1">Free delivery across Pakistan, 7-day returns, Allow-to-Open option.</p>
          <Link to="/shop" className="btn mt-4 bg-white text-brand-700 hover:bg-brand-50">
            Browse the shop <ArrowRight size={16} />
          </Link>
        </div>
      </article>

      {/* Related */}
      {related.length > 0 && (
        <section className="container-px pb-14 max-w-3xl mx-auto">
          <h3 className="font-bold text-lg mb-3">Related articles</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {related.map((p) => (
              <Link key={p.slug} to={`/blog/${p.slug}`} className="card overflow-hidden group">
                <div className="aspect-[16/10] overflow-hidden bg-ink-100">
                  <img src={p.cover} alt={p.title} className="h-full w-full object-cover group-hover:scale-105 transition" loading="lazy" />
                </div>
                <div className="p-3">
                  <h4 className="font-bold text-sm line-clamp-2 group-hover:text-brand-700">{p.title}</h4>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
