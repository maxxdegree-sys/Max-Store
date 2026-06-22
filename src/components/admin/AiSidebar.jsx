import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Sparkles, Loader2, FileText, Type, AlignLeft, HelpCircle, Tags, Gauge, Brain, Link2, Plus, Check
} from 'lucide-react';
import { aiMode, aiPost } from '../../api/client';

// AI suggestion sidebar for the blog editor. Calls the backend AI endpoints
// (stubbed by default; live Groq/Claude when configured) and lets the writer
// apply results into the draft via callbacks.
export default function AiSidebar({ title = '', keywords = [], content = '', posts = [], on = {} }) {
  const [mode, setMode] = useState('stub');
  const [busy, setBusy] = useState('');
  const [titles, setTitles] = useState(null);
  const [meta, setMeta] = useState(null);
  const [faqs, setFaqs] = useState(null);
  const [kw, setKw] = useState(null);
  const [score, setScore] = useState(null);
  const [sem, setSem] = useState(null);
  const [links, setLinks] = useState(null);

  useEffect(() => { aiMode().then((d) => setMode(d.mode)).catch(() => {}); }, []);

  const run = async (key, fn) => {
    setBusy(key);
    try { await fn(); }
    catch (e) { toast.error(e.status === 401 ? 'Sign in to the backend to use AI' : (e.status === 403 ? 'You lack Blog & SEO permission' : (e.message || 'AI request failed'))); }
    finally { setBusy(''); }
  };
  const topic = title || 'this product';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold flex items-center gap-2"><Sparkles size={16} className="text-brand-600" /> AI Assistant</h3>
        <span className={`badge ${mode === 'live' ? 'bg-brand-50 text-brand-700' : 'bg-ink-100 text-ink-600'}`}>{mode === 'live' ? 'Live AI' : 'Sample mode'}</span>
      </div>

      <Group label="Generate">
        <Btn icon={FileText} busy={busy === 'blog'} onClick={() => run('blog', async () => { const r = await aiPost('/generate/blog', { topic, keywords }); on.content?.(r.content); toast.success('Draft inserted'); })}>Generate full draft</Btn>
        <Btn icon={Type} busy={busy === 'title'} onClick={() => run('title', async () => { const r = await aiPost('/generate/title', { topic, keywords }); setTitles(r.titles); })}>Suggest SEO titles</Btn>
        <Btn icon={AlignLeft} busy={busy === 'meta'} onClick={() => run('meta', async () => { const r = await aiPost('/generate/meta', { topic, keywords }); setMeta(r); })}>Meta description</Btn>
        <Btn icon={HelpCircle} busy={busy === 'faq'} onClick={() => run('faq', async () => { const r = await aiPost('/generate/faq', { topic, content }); setFaqs(r.faqs); })}>Generate FAQs</Btn>
        <Btn icon={Tags} busy={busy === 'kw'} onClick={() => run('kw', async () => { const r = await aiPost('/suggest/keywords', { topic }); setKw(r.keywords); })}>Keyword ideas</Btn>
      </Group>

      {titles && (
        <Result title="Title ideas">
          {titles.map((t, i) => (
            <button key={i} onClick={() => { on.title?.(t.title); toast.success('Title applied'); }} className="w-full text-left rounded-lg ring-1 ring-ink-200 dark:ring-white/10 p-2 hover:bg-ink-100 dark:hover:bg-white/5">
              <div className="text-sm font-medium">{t.title}</div>
              <div className="text-[11px] text-ink-500">{t.title.length} chars - {t.reasoning}</div>
            </button>
          ))}
        </Result>
      )}
      {meta && (
        <Result title="Meta description">
          <p className="text-sm">{meta.description}</p>
          <div className="text-[11px] text-ink-500 mb-1">{meta.description.length} chars - {meta.reasoning}</div>
          <button onClick={() => { on.meta?.(meta.description); toast.success('Meta applied'); }} className="btn-outline !py-1 !px-2 text-xs"><Check size={12} /> Apply</button>
        </Result>
      )}
      {faqs && (
        <Result title={`FAQs (${faqs.length})`}>
          {faqs.slice(0, 3).map((f, i) => <div key={i} className="text-xs"><b>{f.question}</b></div>)}
          <button onClick={() => { on.faqs?.(faqs); toast.success('FAQs inserted'); }} className="btn-outline !py-1 !px-2 text-xs mt-1"><Plus size={12} /> Insert all</button>
        </Result>
      )}
      {kw && (
        <Result title="Keyword ideas">
          <div className="flex flex-wrap gap-1">
            {kw.map((k, i) => (
              <button key={i} onClick={() => { on.addKeyword?.(k.keyword); toast.success('Added'); }} className="badge bg-ink-100 text-ink-700 hover:bg-brand-50 hover:text-brand-700">
                {k.keyword} <span className="opacity-60">+{k.volume || ''}</span>
              </button>
            ))}
          </div>
        </Result>
      )}

      <Group label="Analyze">
        <Btn icon={Gauge} busy={busy === 'score'} onClick={() => run('score', async () => { const r = await aiPost('/score/content', { content }); setScore(r); })}>AI content score</Btn>
        <Btn icon={Brain} busy={busy === 'sem'} onClick={() => run('sem', async () => { const r = await aiPost('/analyze/semantic', { content, keywords }); setSem(r); })}>Semantic analysis</Btn>
        <Btn icon={Link2} busy={busy === 'links'} onClick={() => run('links', async () => { const r = await aiPost('/suggest/links', { content, posts }); setLinks(r.links); })}>Internal link ideas</Btn>
      </Group>

      {score && (
        <Result title={`AI score: ${score.overall}/100`}>
          {Object.entries(score.categories).map(([k, v]) => (
            <div key={k} className="text-[11px]">
              <div className="flex justify-between"><span className="capitalize">{k.replace(/([A-Z])/g, ' $1')}</span><span>{v}</span></div>
              <div className="h-1.5 rounded bg-ink-100"><div className="h-full rounded bg-brand-500" style={{ width: v + '%' }} /></div>
            </div>
          ))}
          {score.recommendations?.length > 0 && <ul className="list-disc pl-4 text-[11px] text-ink-500 mt-1">{score.recommendations.slice(0, 4).map((r, i) => <li key={i}>{r}</li>)}</ul>}
        </Result>
      )}
      {sem && (
        <Result title="Semantic analysis">
          <div className="text-[11px] text-ink-500">Entities: {sem.entities.map((e) => e.name).slice(0, 6).join(', ') || 'none'}</div>
          {sem.suggestions?.length > 0 && <ul className="list-disc pl-4 text-[11px] mt-1">{sem.suggestions.slice(0, 4).map((s, i) => <li key={i}>{s}</li>)}</ul>}
        </Result>
      )}
      {links && (
        <Result title="Link suggestions">
          {links.length === 0 && <p className="text-[11px] text-ink-500">No strong matches yet - write more content.</p>}
          {links.map((l, i) => (
            <div key={i} className="text-[11px]">
              <b>{l.anchor}</b> &rarr; /blog/{l.targetSlug} <span className="text-ink-500">({l.reason})</span>
            </div>
          ))}
        </Result>
      )}
    </div>
  );
}

function Group({ label, children }) {
  return (
    <div className="card p-3">
      <div className="text-[10px] font-bold uppercase tracking-widest text-ink-500 mb-2">{label}</div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}
function Btn({ icon: Icon, busy, onClick, children }) {
  return (
    <button onClick={onClick} disabled={!!busy} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm ring-1 ring-ink-200 dark:ring-white/10 hover:bg-ink-100 dark:hover:bg-white/5 disabled:opacity-60">
      {busy ? <Loader2 size={14} className="animate-spin" /> : <Icon size={14} className="text-brand-600" />} {children}
    </button>
  );
}
function Result({ title, children }) {
  return (
    <div className="card p-3 space-y-1.5">
      <div className="text-xs font-bold">{title}</div>
      {children}
    </div>
  );
}
