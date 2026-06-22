// SEO engine: real (deterministic) content analysis + JSON-LD schema builders.
// These power both the SEO scoring panel and the "AI analysis" endpoints, so
// the numbers are meaningful even when the generative AI is stubbed.

import { buildProductSchema as richProductSchema, SITE, STORE as BRAND } from './productSeoEngine.js';

export function stripMd(s = '') {
  return String(s)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_`~|-]/g, ' ')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

const words = (t) => stripMd(t).split(/\s+/).filter(Boolean);
const sentences = (t) => stripMd(t).split(/[.!?]+/).filter((x) => x.trim().length > 2);

function syllables(word) {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '');
  const m = word.match(/[aeiouy]{1,2}/g);
  return m ? m.length : 1;
}

// Flesch Reading Ease (0-100, higher = easier) + approx grade level.
export function readability(content) {
  const w = words(content), s = sentences(content);
  const nw = w.length || 1, ns = s.length || 1;
  const syl = w.reduce((a, x) => a + syllables(x), 0);
  const ease = Math.max(0, Math.min(100, Math.round(206.835 - 1.015 * (nw / ns) - 84.6 * (syl / nw))));
  const grade = Math.max(1, Math.round(0.39 * (nw / ns) + 11.8 * (syl / nw) - 15.59));
  let label = 'Standard';
  if (ease >= 80) label = 'Very easy'; else if (ease >= 60) label = 'Easy'; else if (ease >= 40) label = 'Fairly hard'; else label = 'Difficult';
  return { ease, grade, label, wordCount: nw, sentenceCount: ns };
}

export function keywordDensity(content, keywords = []) {
  const w = words(content).map((x) => x.toLowerCase());
  const total = w.length || 1;
  const out = {};
  keywords.forEach((k) => {
    const kw = String(k).toLowerCase().trim();
    if (!kw) return;
    const parts = kw.split(/\s+/);
    let count = 0;
    if (parts.length === 1) count = w.filter((x) => x.replace(/[^a-z0-9]/g, '') === kw).length;
    else { const joined = w.join(' '); count = (joined.match(new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length; }
    out[k] = Math.round((count / total) * 1000) / 10; // % to 1 dp
  });
  return out;
}

// Lightweight entity extraction: frequent multi-word Capitalized phrases.
export function extractEntities(content) {
  const text = stripMd(content);
  const phrases = text.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b/g) || [];
  const freq = {};
  phrases.forEach((p) => { if (p.length > 3) freq[p] = (freq[p] || 0) + 1; });
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([name, count]) => ({ name, count }));
}

// AI-search optimization heuristics (Google AI Overview / ChatGPT / Perplexity).
export function aiOptimizationScore(content) {
  const checks = [];
  const add = (ok, label) => checks.push({ ok, label });
  const txt = String(content || '');
  add(/^.{40,200}(?:\n|$)/m.test(stripMd(txt).slice(0, 220)), 'Has a concise opening answer block');
  add(/(^|\n)#{2,3}\s/.test(txt) && (txt.match(/(^|\n)#{2,3}\s/g) || []).length >= 3, 'Uses 3+ H2/H3 headings');
  add(/(^|\n)[-*]\s/.test(txt), 'Contains bullet lists');
  add(/\|.*\|/.test(txt), 'Includes a comparison table');
  add(/faq|frequently asked/i.test(txt), 'Has an FAQ section');
  add(words(txt).length >= 600, 'Comprehensive length (600+ words)');
  const score = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);
  return { score, checks };
}

// Overall SEO score from blog + metadata.
export function seoScore(blog = {}, meta = {}) {
  const title = meta.seoTitle || blog.title || '';
  const desc = meta.metaDescription || blog.excerpt || '';
  const content = blog.content || (blog.sections || []).map((s) => `## ${s.h}\n${s.p}`).join('\n') || '';
  const focus = (meta.focusKeyword || '').toLowerCase();
  const r = readability(content);
  const ai = aiOptimizationScore(content);

  const s = {
    title: title.length >= 45 && title.length <= 62 ? 100 : (title.length >= 30 && title.length <= 70 ? 70 : 35),
    description: desc.length >= 120 && desc.length <= 160 ? 100 : (desc.length >= 80 && desc.length <= 175 ? 65 : 30),
    focusKeyword: focus ? (content.toLowerCase().includes(focus) && title.toLowerCase().includes(focus) ? 100 : 55) : 20,
    headings: (content.match(/(^|\n)#{2,3}\s/g) || []).length >= 3 ? 100 : 50,
    readability: r.ease >= 60 ? 100 : (r.ease >= 40 ? 70 : 45),
    length: r.wordCount >= 600 ? 100 : (r.wordCount >= 300 ? 70 : 40),
    aiOptimization: ai.score
  };
  const total = Math.round(Object.values(s).reduce((a, b) => a + b, 0) / Object.keys(s).length);

  const rec = [];
  if (s.title < 100) rec.push('Aim for a 45-62 character SEO title with the focus keyword near the start.');
  if (s.description < 100) rec.push('Write a 120-160 character meta description with a clear value + CTA.');
  if (s.focusKeyword < 100) rec.push('Add a focus keyword and use it in the title and opening paragraph.');
  if (s.headings < 100) rec.push('Add at least 3 H2/H3 headings for clear structure.');
  if (s.aiOptimization < 100) ai.checks.filter((c) => !c.ok).forEach((c) => rec.push('AI search: ' + c.label.replace(/^Has |^Uses |^Contains |^Includes /, 'add ').toLowerCase()));
  return { total, scores: s, readability: r, ai, recommendations: rec };
}

export function articleSchema(blog) {
  return {
    '@context': 'https://schema.org', '@type': 'BlogPosting',
    headline: blog.title, description: blog.excerpt || blog.metaDescription || '',
    image: blog.cover || blog.ogImage || '', datePublished: blog.date, dateModified: blog.updatedAt || blog.date,
    author: { '@type': 'Organization', name: blog.author || BRAND },
    publisher: { '@type': 'Organization', name: BRAND, logo: { '@type': 'ImageObject', url: SITE + '/logo.png' } },
    mainEntityOfPage: { '@type': 'WebPage', '@id': SITE + '/blog/' + blog.slug },
    keywords: blog.keywords || (blog.tags || []).join(', ')
  };
}

export function faqSchema(faqs = []) {
  return {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } }))
  };
}

export function breadcrumbSchema(items = []) {
  return {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: SITE + (it.path || '') }))
  };
}

export function productSchema(p = {}) {
  return richProductSchema(p);
}
