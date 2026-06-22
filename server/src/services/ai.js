// AI content service.
// Stub mode (default) returns realistic, input-driven output so the whole
// workflow works with no API key. Analysis functions (semantic, scoring,
// readability, links) compute REAL metrics from the content - not fake.
//
// Live mode: set USE_REAL_AI=true plus at least one provider key.
//   GROQ_API_KEY   - primary (generous free tier)
//   CLAUDE_API_KEY - fallback, used automatically if the Groq call fails
import { readability, keywordDensity, extractEntities, aiOptimizationScore, stripMd } from '../util/seo.js';
import { buildIndustryProductSeo, buildProductSeoPrompt, stripMarkdownArtifacts } from '../util/productSeoEngine.js';

const GROQ_KEY   = process.env.GROQ_API_KEY;
const CLAUDE_KEY = process.env.CLAUDE_API_KEY;
const USE_REAL = process.env.USE_REAL_AI === 'true' && !!(GROQ_KEY || CLAUDE_KEY);
const GROQ_MODEL   = process.env.GROQ_MODEL   || 'llama-3.3-70b-versatile';
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-latest';
export const aiMode = () => (USE_REAL ? 'live' : 'stub');

const DEFAULT_SYSTEM = 'You are an expert SEO content strategist and writer.';

async function callGroq(prompt, system = DEFAULT_SYSTEM) {
  const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: 'Bearer ' + GROQ_KEY },
    body: JSON.stringify({
      model: GROQ_MODEL,
      max_tokens: 2500,
      messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }]
    })
  });
  if (!resp.ok) throw new Error('Groq API error ' + resp.status);
  const data = await resp.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callClaude(prompt, system = DEFAULT_SYSTEM) {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': CLAUDE_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: CLAUDE_MODEL, max_tokens: 2500, system, messages: [{ role: 'user', content: prompt }] })
  });
  if (!resp.ok) throw new Error('Claude API error ' + resp.status);
  const data = await resp.json();
  return (data.content && data.content[0] && data.content[0].text) || '';
}

// Groq first (free tier), Claude as automatic fallback.
async function callAI(prompt, system = DEFAULT_SYSTEM) {
  if (GROQ_KEY) {
    try {
      return await callGroq(prompt, system);
    } catch (e) {
      if (!CLAUDE_KEY) throw e;
      console.warn('[ai] Groq failed (' + e.message + '), falling back to Claude');
    }
  }
  if (CLAUDE_KEY) return callClaude(prompt, system);
  throw new Error('No AI provider configured (set GROQ_API_KEY or CLAUDE_API_KEY)');
}

// Lenient JSON parsing: models sometimes wrap JSON in ```fences``` or prose.
function tryJson(t, fb) {
  const s = String(t || '').trim();
  const candidates = [s];
  const fenced = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) candidates.push(fenced[1].trim());
  const first = s.search(/[[{]/);
  const last = Math.max(s.lastIndexOf(']'), s.lastIndexOf('}'));
  if (first >= 0 && last > first) candidates.push(s.slice(first, last + 1));
  for (const c of candidates) {
    try { return JSON.parse(c); } catch { /* try next */ }
  }
  return fb;
}
const titleCase = (s) => String(s).replace(/\b\w/g, (c) => c.toUpperCase());

export async function generateBlog({ topic = '', keywords = [], tone = 'professional', length = 'medium' }) {
  if (USE_REAL) {
    const txt = await callAI(`Write a ${length} ${tone} SEO blog post about "${topic}". Target keywords: ${keywords.join(', ')}. Start with a concise answer to "What is ${topic}?", use H2/H3 headings, bullet points, one comparison table, and end with 5 FAQs. Return markdown.`);
    const r = readability(txt);
    return { content: txt, readTime: Math.max(1, Math.round(r.wordCount / 200)), mode: 'live' };
  }
  const kw = keywords.length ? keywords : [topic];
  const t = topic || 'this topic';
  const content =
`## What is ${titleCase(t)}?

${titleCase(t)} is a practical choice for Pakistani households looking for quality and value. In short: it saves time, lasts longer when chosen well, and fits everyday use across homes in cities like Kharian, Lahore and Karachi.

## Key highlights

- Designed for daily use and Pakistani conditions (voltage, water, climate)
- Best value when you match features to how you actually cook and live
- Easy ordering with Cash on Delivery across Pakistan

## Why it matters

When buying ${t.toLowerCase()}, focus on build quality, after-sales support and the right size for your family. Cheap is rarely cheapest over a year of use.

## How to choose the right one

1. Decide your real need (size, power, frequency of use).
2. Compare warranty and spare-part availability.
3. Read genuine customer reviews before ordering.

## Quick comparison

| Option | Best for | Approx. price |
|--------|----------|---------------|
| Entry  | Light/occasional use | Lower |
| Mid    | Daily family use | Balanced |
| Premium| Heavy/long-term use | Higher |

## Frequently asked questions

Use the AI "Generate FAQs" button to expand this section.

---
Target keywords: ${kw.join(', ')}.`;
  const r = readability(content);
  return { content, readTime: Math.max(1, Math.round(r.wordCount / 200)), mode: 'stub' };
}

export async function seoTitles({ topic = '', keywords = [] }) {
  if (USE_REAL) return tryJson(await callAI(`Give 5 SEO titles (50-60 chars) for "${topic}" using keywords ${keywords.join(', ')}. Return JSON array of {title,reasoning}.`), []);
  const k = keywords[0] || topic;
  const yr = new Date().getFullYear();
  return [
    { title: `${titleCase(topic)} in Pakistan (${yr} Buyer's Guide)`, reasoning: 'Keyword + year + intent signal.' },
    { title: `Best ${titleCase(k)}: Top Picks & Prices ${yr}`, reasoning: 'Commercial intent with "best" and "prices".' },
    { title: `How to Choose ${titleCase(topic)} - Simple Guide`, reasoning: 'Matches "how to" informational searches.' },
    { title: `${titleCase(topic)}: What Pakistani Families Should Know`, reasoning: 'Local relevance for engagement.' },
    { title: `${titleCase(k)} Guide: Features, Prices & Tips`, reasoning: 'Covers multiple query variations.' }
  ];
}

export async function metaDescription({ topic = '', keywords = [] }) {
  if (USE_REAL) return tryJson(await callAI(`Write a 150-160 char meta description for "${topic}" using ${keywords.join(', ')}. Return JSON {description,reasoning}.`), {});
  const k = keywords[0] || topic;
  return { description: `Looking for ${k} in Pakistan? Compare features, prices and top picks, then order online with Cash on Delivery from Maxx.`.slice(0, 160), reasoning: 'Keyword early, value + CTA, under 160 chars.' };
}

export async function faqs({ topic = '', content = '' }) {
  if (USE_REAL) return tryJson(await callAI(`Generate 6 FAQ {question,answer} (answers 40-70 words) for "${topic}". Content: ${stripMd(content).slice(0, 2000)}. Return JSON array.`), []);
  const t = topic || 'this product';
  return [
    { question: `What is the best ${t} for a Pakistani home?`, answer: `The best ${t} balances build quality, the right size for your family, and reliable after-sales support. For daily use, choose a mid-range option with a warranty and easily available spare parts.` },
    { question: `How much does ${t} cost in Pakistan?`, answer: `Prices vary by brand and features. Entry options are budget-friendly, while premium models cost more but last longer. Check the current price and discounts on the Maxx product page before ordering.` },
    { question: `Is Cash on Delivery available?`, answer: `Yes. Maxx offers Cash on Delivery across Pakistan, plus an optional allow-to-open delivery so you can inspect the item before paying.` },
    { question: `Does it come with a warranty?`, answer: `Most products include a manufacturer warranty. The exact period is listed in the product specifications. Keep your order ID for any warranty or replacement request.` },
    { question: `How do I order online?`, answer: `Add the item to your cart, choose COD or bank transfer, enter your delivery address and confirm. You will receive a tracking update and our team can help on WhatsApp.` }
  ];
}

export async function keywordIdeas({ topic = '' }) {
  if (USE_REAL) return tryJson(await callAI(`Suggest 8 SEO keywords for "${topic}" with intent. Return JSON array of {keyword,intent,difficulty,volume}.`), []);
  const t = (topic || 'product').toLowerCase();
  const mk = (kw, intent, d, v) => ({ keyword: kw, intent, difficulty: d, volume: v });
  return [
    mk(`${t} price in pakistan`, 'transactional', 38, 2400),
    mk(`best ${t} pakistan`, 'commercial', 45, 1900),
    mk(`${t} online`, 'transactional', 30, 1600),
    mk(`how to choose ${t}`, 'informational', 22, 880),
    mk(`${t} review`, 'commercial', 28, 720),
    mk(`cheap ${t} pakistan`, 'transactional', 25, 590),
    mk(`${t} for home`, 'informational', 18, 480),
    mk(`${t} cash on delivery`, 'transactional', 15, 320)
  ];
}

// ---- Real analysis (same output in stub or live mode) ----
export function semanticAnalysis({ content = '', keywords = [] }) {
  const ai = aiOptimizationScore(content);
  const r = readability(content);
  const entities = extractEntities(content);
  const density = keywordDensity(content, keywords);
  const related = keywords.flatMap((k) => [`${k} price`, `best ${k}`, `${k} reviews`]).slice(0, 8);
  const semanticScore = Math.min(100, entities.length * 8 + (Object.values(density).some((d) => d > 0) ? 30 : 0));
  const suggestions = [];
  if (entities.length < 5) suggestions.push('Mention more specific entities (brands, models, places) to strengthen topical signals.');
  Object.entries(density).forEach(([k, d]) => { if (d === 0) suggestions.push(`Focus keyword "${k}" not found - use it naturally in the body.`); else if (d > 3) suggestions.push(`Keyword "${k}" density is high (${d}%) - reduce to avoid stuffing.`); });
  return { entities, keywordDensity: density, relatedTerms: related, scores: { aiReadability: ai.score, readingEase: r.ease, semantic: semanticScore }, aiChecks: ai.checks, suggestions };
}

export function contentScore({ content = '' }) {
  const ai = aiOptimizationScore(content);
  const r = readability(content);
  const c = {
    conciseness: ai.checks[0]?.ok ? 90 : 45,
    structuredData: (ai.checks[1]?.ok ? 40 : 0) + (ai.checks[2]?.ok ? 30 : 0) + (ai.checks[3]?.ok ? 30 : 0),
    semanticRichness: Math.min(100, extractEntities(content).length * 9),
    conversationalFlow: r.ease >= 60 ? 90 : (r.ease >= 40 ? 65 : 40),
    answerOptimization: ai.checks[4]?.ok ? 90 : 40,
    comprehensiveness: r.wordCount >= 800 ? 100 : Math.round((r.wordCount / 800) * 100)
  };
  const overall = Math.round(Object.values(c).reduce((a, b) => a + b, 0) / Object.keys(c).length);
  const recommendations = ai.checks.filter((x) => !x.ok).map((x) => x.label);
  return { overall, categories: c, readability: r, recommendations };
}

export function internalLinks({ content = '', posts = [] }) {
  const text = stripMd(content).toLowerCase();
  const out = [];
  posts.forEach((p) => {
    const title = (p.title || '').toLowerCase();
    const tagHit = (p.tags || []).find((t) => text.includes(String(t).toLowerCase()));
    const ws = title.split(/\s+/).filter((w) => w.length > 4);
    const titleHit = ws.find((w) => text.includes(w));
    if (tagHit || titleHit) {
      out.push({ targetSlug: p.slug, targetTitle: p.title, anchor: titleHit ? titleCase(titleHit) : tagHit, score: tagHit && titleHit ? 9 : 6, reason: tagHit ? `Shares topic "${tagHit}"` : `Title term "${titleHit}" appears in content` });
    }
  });
  return out.sort((a, b) => b.score - a.score).slice(0, 6);
}

// ---- Product listing optimization (SEO + content fix) ----
function stubOptimizeProduct(p) {
  const brand = p.brand || 'Maxx';
  const cat = (p.category || '').replace(/-/g, ' ');
  const t = (p.title || 'Product').trim();
  const seoTitle = (t.length <= 50 ? t + ' - Buy Online in Pakistan' : t).slice(0, 70);
  const focusKeyword = t.toLowerCase().split(/\s+/).slice(0, 3).join(' ');
  const metaDescription = ('Buy ' + t + ' (' + brand + ') in Pakistan. ' + (cat ? cat + ', ' : '') + 'quality checked, Cash on Delivery, fast shipping. Order from Maxx.').replace(/\s+/g, ' ').slice(0, 158);
  const short = (p.short && p.short.length >= 20) ? p.short : (t + ' by ' + brand + ' - reliable ' + (cat || 'everyday') + ' pick with Cash on Delivery across Pakistan.');
  const specLines = (p.specs && Object.keys(p.specs).length) ? Object.entries(p.specs).map(([k, v]) => '- ' + k + ': ' + v).join('\n') : '- Quality materials\n- Designed for daily use';
  const description = (p.description && p.description.length >= 160) ? p.description :
    ('## About ' + t + '\n\n' + t + ' from ' + brand + ' is a dependable choice for Pakistani homes, with great value for ' + (cat || 'everyday use') + '.\n\n## Key features\n' + specLines + '\n\n## Why buy from Maxx\n- Genuine products, quality checked before dispatch\n- Cash on Delivery and bank transfer accepted\n- Fast shipping across Pakistan with easy returns\n\n## Frequently asked questions\n**Is Cash on Delivery available?** Yes, across Pakistan, with an allow-to-open option.\n**Is there a warranty?** Warranty details are listed in the specifications above.');
  const tags = Array.from(new Set([...(p.tags || []), 'featured'])).slice(0, 6);
  return { title: t, short, description, tags, seo: { seoTitle, metaDescription, focusKeyword } };
}

export async function optimizeProduct({ product = {} }) {
  const p = product || {};
  if (USE_REAL) {
    try {
      const out = await callAI(buildProductSeoPrompt(p), DEFAULT_SYSTEM);
      const j = tryJson(out, null);
      if (j && j.title) {
        const focus = j.focusKeyword || buildIndustryProductSeo(p).seo.focusKeyword;
        return {
          mode: 'live',
          product: {
            title: j.title,
            short: stripMarkdownArtifacts(j.short || p.short),
            description: stripMarkdownArtifacts(j.description || p.description),
            tags: Array.isArray(j.tags) ? j.tags : (p.tags || []),
            keywords: [focus, p.brand, p.category].filter(Boolean).join(', '),
            seo: {
              seoTitle: stripMarkdownArtifacts(j.seoTitle || '').slice(0, 60),
              metaDescription: stripMarkdownArtifacts(j.metaDescription || '').slice(0, 160),
              focusKeyword: focus
            }
          }
        };
      }
    } catch { /* fall through to industry local optimizer */ }
  }
  return { mode: 'industry', product: buildIndustryProductSeo(p) };
}
