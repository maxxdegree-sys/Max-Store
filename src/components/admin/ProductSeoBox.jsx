import { useState } from 'react';
import toast from 'react-hot-toast';
import { Gauge, Sparkles, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { productSeoScore, seoBadgeClass, localOptimizeProduct, deriveFocusKeyword } from '../../utils/productSeo';
import { optimizeProductApi } from '../../api/client';

// SEO score + issues + one-click "Optimize SEO & fix listing" for a product.
// `product` is the editing draft; `onChange(patch)` merges fields back into it.
export default function ProductSeoBox({ product, onChange }) {
  const [busy, setBusy] = useState(false);
  const { score, label, issues } = productSeoScore(product);
  const seo = product.seo || {};
  const setSeo = (k, v) => onChange({ seo: { ...seo, [k]: v } });

  const optimize = async () => {
    setBusy(true);
    try {
      const { product: opt } = await optimizeProductApi(product);
      onChange({ title: opt.title || product.title, short: opt.short, description: opt.description, tags: opt.tags || product.tags, keywords: opt.keywords || product.keywords, seo: { ...seo, ...opt.seo } });
      toast.success('SEO enhanced — review plain-text fields and Save');
    } catch (e) {
      // Backend not running -> optimize on the spot, locally.
      onChange(localOptimizeProduct(product));
      toast.success('SEO enhanced (offline) — review and Save');
    } finally { setBusy(false); }
  };

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm flex items-center gap-2"><Gauge size={16} className="text-brand-600" /> SEO</h3>
        <span className={`badge ${seoBadgeClass(score)}`}>{score}/100 - {label}</span>
      </div>

      <div className="h-2 rounded-full bg-ink-100 dark:bg-white/10 overflow-hidden">
        <div className={`h-full ${score >= 80 ? 'bg-brand-500' : score >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: score + '%' }} />
      </div>

      {issues.length === 0 ? (
        <p className="text-xs text-brand-700 flex items-center gap-1"><CheckCircle2 size={13} /> Looks good - well optimized.</p>
      ) : (
        <ul className="space-y-1">
          {issues.map((it, i) => (
            <li key={i} className="text-xs text-ink-600 dark:text-ink-300 flex items-start gap-1.5"><AlertCircle size={12} className="text-amber-500 mt-0.5 shrink-0" /> {it}</li>
          ))}
        </ul>
      )}

      <button type="button" onClick={optimize} disabled={busy} className="btn-primary w-full !py-2.5 text-sm disabled:opacity-60">
        {busy ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />} Enhance SEO (Pakistan e-commerce)
      </button>

      <p className="text-[11px] text-ink-500 leading-relaxed">
        Optimizes for Pakistani search: price in meta, COD, category keywords, and Google Product schema fields.
      </p>

      <div className="space-y-2 pt-1">
        <label className="text-sm block">
          <div className="flex justify-between"><span className="font-semibold text-xs">SEO title</span><span className="text-[10px] text-ink-500">{(seo.seoTitle || '').length}/60</span></div>
          <input className="input !py-2 !text-sm" value={seo.seoTitle || ''} onChange={(e) => setSeo('seoTitle', e.target.value)} placeholder="e.g. Philips Kettle Rs. 4,299 | Philips | Maxx" />
        </label>
        <label className="text-sm block">
          <div className="flex justify-between"><span className="font-semibold text-xs">Meta description</span><span className="text-[10px] text-ink-500">{(seo.metaDescription || '').length}/160</span></div>
          <textarea rows={2} className="input !text-sm" value={seo.metaDescription || ''} onChange={(e) => setSeo('metaDescription', e.target.value)} placeholder="Buy [product] in Pakistan. Rs. [price]. COD nationwide. Order from Maxx, Kharian." />
        </label>
        <label className="text-sm block">
          <div className="font-semibold text-xs mb-1">Focus keyword</div>
          <input className="input !py-2 !text-sm" value={seo.focusKeyword || ''} onChange={(e) => setSeo('focusKeyword', e.target.value)} placeholder={deriveFocusKeyword(product)} />
        </label>
      </div>
    </div>
  );
}
