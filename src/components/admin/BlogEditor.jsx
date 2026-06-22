import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { X, Save, Send, Plus, Trash2 } from 'lucide-react';
import { slugify } from '../../utils/format';
import { blogCreateApi, blogUpdateApi } from '../../api/client';
import ImageUploader from './ImageUploader';
import AiSidebar from './AiSidebar';
import SeoPanel from './SeoPanel';

// Markdown -> {h,p} sections so the storefront BlogPost renderer can show it.
function toSections(md = '') {
  const lines = md.split('\n');
  const out = []; let cur = null;
  for (const ln of lines) {
    const hm = ln.match(/^#{1,3}\s+(.*)/);
    if (hm) { if (cur) out.push(cur); cur = { h: hm[1].trim(), p: '' }; }
    else if (cur) cur.p += (cur.p ? '\n' : '') + ln;
  }
  if (cur) out.push(cur);
  return out.map((s) => ({ h: s.h, p: s.p.trim() })).filter((s) => s.h);
}
const DEFAULT_COVER = 'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=1200&q=80&auto=format&fit=crop';

export default function BlogEditor({ post, onClose }) {
  const editing = !!post;
  const [saving, setSaving] = useState(false);

  const [d, setD] = useState(() => ({
    title: post?.title || '', slug: post?.slug || '', excerpt: post?.excerpt || '',
    content: post?.content || (post?.sections || []).map((s) => `## ${s.h}\n${s.p}`).join('\n\n') || '',
    cover: post?.cover || '', author: post?.author || 'Maxx Editorial',
    tags: post?.tags || [], category: post?.category || '', status: post?.status || 'draft',
    readTime: post?.readTime || 5, keywords: post?.keywords || '',
    faqs: post?.faqs || [], seo: post?.seo || {}
  }));
  const [tagInput, setTagInput] = useState('');
  const set = (k, v) => setD((x) => ({ ...x, [k]: v }));
  const setSeo = (k, v) => setD((x) => ({ ...x, seo: { ...x.seo, [k]: v } }));

  const keywords = useMemo(() => [d.seo.focusKeyword, ...d.tags].filter(Boolean), [d.seo.focusKeyword, d.tags]);
  const linkPosts = [];

  const addTag = () => { const t = tagInput.trim().toLowerCase(); if (t && !d.tags.includes(t)) set('tags', [...d.tags, t]); setTagInput(''); };
  const addFaq = () => set('faqs', [...d.faqs, { question: '', answer: '' }]);
  const setFaq = (i, k, v) => set('faqs', d.faqs.map((f, idx) => (idx === i ? { ...f, [k]: v } : f)));
  const delFaq = (i) => set('faqs', d.faqs.filter((_, idx) => idx !== i));

  const save = async (status) => {
    if (!d.title.trim()) return toast.error('Title is required');
    if (saving) return;
    setSaving(true);
    const wordCount = d.content.split(/\s+/).filter(Boolean).length;
    const built = {
      slug: (d.slug.trim() || slugify(d.title)),
      title: d.title.trim(), summary: d.excerpt || d.seo.metaDescription || d.title,
      cover: d.cover || DEFAULT_COVER, author: d.author,
      date: post?.date || new Date().toISOString().slice(0, 10),
      readTime: d.readTime || Math.max(1, Math.round(wordCount / 200)),
      tags: d.tags, keywords: d.keywords || d.seo.focusKeyword || '',
      content: d.content, sections: toSections(d.content), faqs: d.faqs.filter((f) => f.question),
      category: d.category, status: status || d.status, seo: d.seo
    };
    try {
      if (editing) {
        await blogUpdateApi(post.slug, built);
      } else {
        await blogCreateApi(built);
      }
      toast.success(status === 'published' ? 'Published' : 'Saved');
      onClose(true);
    } catch (err) {
      toast.error(err.message || 'Failed to save post');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="btn-ghost !p-2"><X size={18} /></button>
          <h1 className="text-lg font-extrabold">{editing ? 'Edit post' : 'New post'}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => save('draft')} disabled={saving} className="btn-outline !py-2 !px-3 text-sm"><Save size={14} /> {saving ? 'Saving…' : 'Save draft'}</button>
          <button onClick={() => save('published')} disabled={saving} className="btn-primary !py-2 !px-3 text-sm"><Send size={14} /> Publish</button>
        </div>
      </header>

      <div className="grid lg:grid-cols-[1fr_340px] gap-5 items-start">
        {/* Main form */}
        <div className="space-y-4">
          <input value={d.title} onChange={(e) => set('title', e.target.value)} placeholder="Post title" className="input !text-lg font-bold" />
          <div className="grid sm:grid-cols-2 gap-3">
            <L label="Slug (URL)"><input className="input !py-2 !text-sm" value={d.slug} onChange={(e) => set('slug', e.target.value)} placeholder={slugify(d.title) || 'auto-from-title'} /></L>
            <L label="Status">
              <select className="input !py-2 !text-sm" value={d.status} onChange={(e) => set('status', e.target.value)}>
                <option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="published">Published</option>
              </select>
            </L>
          </div>
          <L label="Excerpt"><textarea rows={2} className="input !text-sm" value={d.excerpt} onChange={(e) => set('excerpt', e.target.value)} placeholder="One-line summary for cards and search" /></L>
          <L label="Content (Markdown - use ## for headings, - for bullets, | for tables)">
            <textarea rows={16} className="input !text-sm font-mono" value={d.content} onChange={(e) => set('content', e.target.value)} placeholder="Write or click 'Generate full draft' in the AI panel..." />
          </L>

          {/* Tags + category */}
          <div className="grid sm:grid-cols-2 gap-3">
            <L label="Tags">
              <div className="flex gap-1 flex-wrap mb-1">
                {d.tags.map((t) => <span key={t} className="badge bg-brand-50 text-brand-700">{t} <button onClick={() => set('tags', d.tags.filter((x) => x !== t))}>&times;</button></span>)}
              </div>
              <input className="input !py-2 !text-sm" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} placeholder="type a tag, press Enter" />
            </L>
            <L label="Category"><input className="input !py-2 !text-sm" value={d.category} onChange={(e) => set('category', e.target.value)} placeholder="e.g. Buying Guides" /></L>
          </div>

          {/* Featured image */}
          <L label="Featured image">
            <ImageUploader images={d.cover ? [d.cover] : []} onChange={(imgs) => set('cover', imgs[0] || '')} productId={null} />
          </L>

          {/* FAQ blocks */}
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm">FAQ blocks (great for AI search)</h3>
              <button onClick={addFaq} className="btn-outline !py-1 !px-2 text-xs"><Plus size={12} /> Add</button>
            </div>
            <div className="space-y-2 mt-2">
              {d.faqs.length === 0 && <p className="text-xs text-ink-500">No FAQs yet. Use the AI panel to generate them.</p>}
              {d.faqs.map((f, i) => (
                <div key={i} className="rounded-lg ring-1 ring-ink-200 dark:ring-white/10 p-2 space-y-1">
                  <div className="flex gap-1">
                    <input className="input !py-1.5 !text-sm flex-1" value={f.question} onChange={(e) => setFaq(i, 'question', e.target.value)} placeholder="Question" />
                    <button onClick={() => delFaq(i)} className="btn-ghost !p-1.5 text-rose-500"><Trash2 size={13} /></button>
                  </div>
                  <textarea rows={2} className="input !py-1.5 !text-sm" value={f.answer} onChange={(e) => setFaq(i, 'answer', e.target.value)} placeholder="Answer (40-70 words)" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right rail */}
        <div className="space-y-5 lg:sticky lg:top-20">
          <AiSidebar
            title={d.title} keywords={keywords} content={d.content} posts={linkPosts}
            on={{
              content: (md) => set('content', md),
              title: (t) => { set('title', t); setSeo('seoTitle', t); },
              meta: (m) => setSeo('metaDescription', m),
              faqs: (arr) => set('faqs', [...d.faqs, ...arr]),
              addKeyword: (k) => { if (!d.tags.includes(k)) set('tags', [...d.tags, k]); }
            }}
          />
          <SeoPanel seo={d.seo} onChange={setSeo} title={d.title} content={d.content} excerpt={d.excerpt} faqs={d.faqs} post={{ slug: d.slug, cover: d.cover, date: post?.date, author: d.author, tags: d.tags }} />
        </div>
      </div>
    </div>
  );
}

function L({ label, children }) {
  return (
    <label className="text-sm block">
      <div className="font-semibold mb-1 text-xs text-ink-600 dark:text-ink-300">{label}</div>
      {children}
    </label>
  );
}
