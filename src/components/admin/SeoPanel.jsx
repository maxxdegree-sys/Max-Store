import { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { Gauge, Code2, Copy, Loader2 } from 'lucide-react';
import { seoScoreApi, seoSchema } from '../../api/client';

const tone = (n) => (n >= 80 ? 'text-brand-600' : n >= 50 ? 'text-amber-600' : 'text-rose-600');
const barTone = (n) => (n >= 80 ? 'bg-brand-500' : n >= 50 ? 'bg-amber-500' : 'bg-rose-500');

// SEO metadata fields + real-time score + JSON-LD schema generator.
export default function SeoPanel({ seo = {}, onChange, title = '', content = '', excerpt = '', faqs = [], post = {} }) {
  const [score, setScore] = useState(null);
  const [busy, setBusy] = useState(false);
  const [schema, setSchema] = useState('');
  const timer = useRef(null);

  const set = (k) => (e) => onChange?.(k, e.target.value);

  // Debounced live SEO scoring.
  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setBusy(true);
      seoScoreApi({ title, content, excerpt }, { seoTitle: seo.seoTitle, metaDescription: seo.metaDescription, focusKeyword: seo.focusKeyword })
        .then(setScore).catch(() => setScore(null)).finally(() => setBusy(false));
    }, 700);
    return () => clearTimeout(timer.current);
  }, [title, content, excerpt, seo.seoTitle, seo.metaDescription, seo.focusKeyword]);

  const genSchema = async (type) => {
    try {
      const body = type === 'faq'
        ? { faqs }
        : { blog: { title: seo.seoTitle || title, slug: post.slug, excerpt: seo.metaDescription || excerpt, cover: seo.ogImage || post.cover, date: post.date, author: post.author, tags: post.tags, keywords: seo.focusKeyword } };
      const r = await seoSchema(type, body);
      setSchema(JSON.stringify(r.schema, null, 2));
    } catch (e) { toast.error(e.status === 401 ? 'Sign in to the backend' : e.message); }
  };

  const t = (seo.seoTitle || '').length;
  const m = (seo.metaDescription || '').length;

  return (
    <div className="space-y-4">
      <h3 className="font-bold flex items-center gap-2"><Gauge size={16} className="text-brand-600" /> SEO</h3>

      {/* Live score */}
      <div className="card p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-widest text-ink-500">SEO score</span>
          {busy ? <Loader2 size={14} className="animate-spin text-ink-400" /> : score && <span className={`text-2xl font-extrabold ${tone(score.total)}`}>{score.total}</span>}
        </div>
        {score && (
          <div className="mt-2 space-y-1">
            {Object.entries(score.scores).map(([k, v]) => (
              <div key={k} className="text-[11px]">
                <div className="flex justify-between"><span className="capitalize">{k.replace(/([A-Z])/g, ' $1')}</span><span>{v}</span></div>
                <div className="h-1.5 rounded bg-ink-100 dark:bg-white/10"><div className={`h-full rounded ${barTone(v)}`} style={{ width: v + '%' }} /></div>
              </div>
            ))}
            {score.recommendations?.length > 0 && (
              <ul className="list-disc pl-4 text-[11px] text-ink-500 pt-1">{score.recommendations.slice(0, 5).map((r, i) => <li key={i}>{r}</li>)}</ul>
            )}
          </div>
        )}
      </div>

      {/* Fields */}
      <Field label={`SEO title (${t}/60)`} hint={t >= 45 && t <= 62 ? 'good' : 'aim 45-62'}>
        <input className="input !py-2 !text-sm" value={seo.seoTitle || ''} onChange={set('seoTitle')} placeholder={title} />
      </Field>
      <Field label={`Meta description (${m}/160)`} hint={m >= 120 && m <= 160 ? 'good' : 'aim 120-160'}>
        <textarea rows={3} className="input !text-sm" value={seo.metaDescription || ''} onChange={set('metaDescription')} placeholder={excerpt} />
      </Field>
      <Field label="Focus keyword">
        <input className="input !py-2 !text-sm" value={seo.focusKeyword || ''} onChange={set('focusKeyword')} placeholder="e.g. air fryer pakistan" />
      </Field>
      <Field label="Canonical URL">
        <input className="input !py-2 !text-sm" value={seo.canonicalUrl || ''} onChange={set('canonicalUrl')} placeholder="https://alrafiq.pk/blog/..." />
      </Field>
      <Field label="Open Graph image URL">
        <input className="input !py-2 !text-sm" value={seo.ogImage || ''} onChange={set('ogImage')} placeholder="social share image" />
      </Field>

      {/* Schema generator */}
      <div className="card p-3 space-y-2">
        <div className="text-xs font-bold flex items-center gap-2"><Code2 size={14} /> Schema markup</div>
        <div className="flex gap-1 flex-wrap">
          {['article', 'faq', 'breadcrumb'].map((s) => <button key={s} onClick={() => genSchema(s)} className="btn-outline !py-1 !px-2 text-xs capitalize">{s}</button>)}
        </div>
        {schema && (
          <div>
            <pre className="text-[10px] bg-ink-900 text-brand-100 rounded-lg p-2 overflow-x-auto max-h-44">{schema}</pre>
            <button onClick={() => { navigator.clipboard?.writeText(schema); toast.success('Copied'); }} className="btn-ghost !py-1 !px-2 text-xs mt-1"><Copy size={12} /> Copy JSON-LD</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <label className="text-sm block">
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold text-xs text-ink-600 dark:text-ink-300">{label}</span>
        {hint && <span className={`text-[10px] ${hint === 'good' ? 'text-brand-600' : 'text-amber-600'}`}>{hint}</span>}
      </div>
      {children}
    </label>
  );
}
