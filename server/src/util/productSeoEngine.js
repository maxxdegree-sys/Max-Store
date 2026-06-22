/**
 * Pakistan e-commerce product SEO engine.
 * Used by AI optimize, offline fallback, schema builders, and scoring hints.
 */

import { categoryBySlug, categoryLabel, subcategoryBySlug } from '../../../src/data/categories.js';

const SITE = process.env.SITE_URL || 'https://alrafiq.pk';
const STORE = 'Maxx';

export function stripMarkdownArtifacts(text = '') {
  let s = String(text || '');
  s = s.replace(/^#{1,6}\s+/gm, '');
  s = s.replace(/\*\*([^*]+)\*\*/g, '$1');
  s = s.replace(/\*([^*]+)\*/g, '$1');
  s = s.replace(/__([^_]+)__/g, '$1');
  s = s.replace(/_([^_]+)_/g, '$1');
  s = s.replace(/^\s*[-*•]\s+/gm, '');
  return s.replace(/\n{3,}/g, '\n\n').replace(/[ \t]+/g, ' ').trim();
}

export function formatPKR(n) {
  const v = Math.round(Number(n) || 0);
  return 'Rs. ' + v.toLocaleString('en-PK');
}

/** Long-tail focus keyword for Pakistani transactional search. */
export function deriveFocusKeyword(p = {}) {
  const title = (p.title || 'product').trim().toLowerCase();
  const cat = categoryBySlug(p.category);
  const sub = p.subcategory ? subcategoryBySlug(p.category, p.subcategory) : null;
  const base = title.split(/\s+/).slice(0, 3).join(' ');
  const catWord = (sub?.name || cat?.name || '').toLowerCase().split(/\s+/)[0];
  if (base.includes('pakistan')) return base;
  if (catWord && !base.includes(catWord)) return `${base} ${catWord} pakistan`;
  return `${base} pakistan`;
}

/** SEO title: Product + price signal + brand + store (max 60). */
export function buildSeoTitle(p = {}) {
  const title = (p.title || 'Product').trim();
  const brand = (p.brand || '').trim();
  const price = Number(p.price) || 0;
  const candidates = [
    price > 0 ? `${title} ${formatPKR(price)} | ${brand || 'Pakistan'} | Maxx` : null,
    `${title} Price in Pakistan | ${brand || 'Buy Online'} | Maxx`,
    `${title} | Buy Online Pakistan | Maxx`,
    title
  ].filter(Boolean);
  for (const c of candidates) {
    if (c.length <= 60) return c;
  }
  return candidates[candidates.length - 1].slice(0, 60).replace(/\s+\S*$/, '').trim() || title.slice(0, 60);
}

/** Meta description: benefit + price + COD + CTA (120–160 chars). */
export function buildMetaDescription(p = {}) {
  const title = (p.title || 'Product').trim();
  const brand = (p.brand || 'Maxx').trim();
  const price = Number(p.price) || 0;
  const mrp = Number(p.mrp) || 0;
  const catLabel = categoryLabel(p.category, p.subcategory);
  const spec = p.specs && Object.keys(p.specs).length
    ? Object.entries(p.specs).slice(0, 1).map(([k, v]) => `${k}: ${v}`).join('')
    : '';
  const benefit = (p.short && p.short.length >= 15)
    ? stripMarkdownArtifacts(p.short).split(/[.!]/)[0]
    : (spec ? `${spec}.` : `Genuine ${catLabel || 'quality product'}.`);
  const priceBit = price > 0
    ? (mrp > price ? `Now ${formatPKR(price)} (was ${formatPKR(mrp)}). ` : `${formatPKR(price)}. `)
    : '';
  const raw = `Buy ${title} by ${brand} in Pakistan. ${priceBit}${benefit} Cash on Delivery nationwide. Order from Maxx, Kharian.`;
  const cleaned = raw.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= 160) return cleaned;
  return cleaned.slice(0, 157).replace(/\s+\S*$/, '') + '…';
}

function specParagraph(p) {
  if (!p.specs || !Object.keys(p.specs).length) return '';
  const lines = Object.entries(p.specs).slice(0, 6).map(([k, v]) => `${k}: ${v}`).join('. ');
  return `Specifications: ${lines}.`;
}

/** Full product description — plain paragraphs, keyword-aware. */
export function buildProductDescription(p = {}) {
  const title = (p.title || 'Product').trim();
  const brand = (p.brand || 'Maxx').trim();
  const catLabel = categoryLabel(p.category, p.subcategory) || 'everyday essentials';
  const focus = deriveFocusKeyword(p);
  const price = Number(p.price) || 0;
  const existing = stripMarkdownArtifacts(p.description || '');
  if (existing.length >= 200 && existing.toLowerCase().includes(focus.split(' ')[0])) return existing;

  const paras = [
    `The ${title} from ${brand} is a top choice for shoppers looking for ${focus} with reliable quality and value. Ideal for ${catLabel.toLowerCase()} needs across Pakistani homes.`,
    specParagraph(p),
    price > 0 ? `Available at ${formatPKR(price)} with Cash on Delivery and fast shipping across Pakistan including Lahore, Karachi, Islamabad and Kharian.` : 'Available with Cash on Delivery and fast shipping across Pakistan.',
    'Maxx offers genuine products, easy returns on eligible items, and friendly support via WhatsApp. Order online today or visit our Kharian store.'
  ].filter(Boolean);
  return paras.join('\n\n');
}

export function buildProductTags(p = {}) {
  const tags = new Set([...(p.tags || [])]);
  if (p.category) tags.add(p.category);
  if (p.subcategory) tags.add(p.subcategory);
  if (p.brand) tags.add(p.brand.toLowerCase().replace(/\s+/g, '-'));
  tags.add('pakistan');
  tags.add('cod');
  if (Number(p.price) > 0) tags.add('best-price');
  return Array.from(tags).filter(Boolean).slice(0, 8);
}

/** Industry-grade SEO fields for a product listing. */
export function buildIndustryProductSeo(p = {}) {
  const title = (p.title || 'Product').trim();
  const focusKeyword = deriveFocusKeyword(p);
  const seoTitle = buildSeoTitle(p);
  const metaDescription = buildMetaDescription(p);
  const short = (p.short && stripMarkdownArtifacts(p.short).length >= 20)
    ? stripMarkdownArtifacts(p.short)
    : `Shop ${title} (${p.brand || 'Maxx'}) — ${categoryLabel(p.category, p.subcategory) || 'quality product'} with Cash on Delivery across Pakistan.`;
  const description = buildProductDescription({ ...p, short });
  const tags = buildProductTags(p);
  const keywords = [focusKeyword, p.brand, categoryLabel(p.category, p.subcategory), 'cash on delivery', 'pakistan']
    .filter(Boolean).join(', ');
  return {
    title,
    short,
    description,
    tags,
    keywords,
    seo: { seoTitle, metaDescription, focusKeyword }
  };
}

/** Prompt for live AI — Pakistan e-commerce best practices. */
export function buildProductSeoPrompt(p = {}) {
  const catLabel = categoryLabel(p.category, p.subcategory);
  const focus = deriveFocusKeyword(p);
  const titleExample = buildSeoTitle(p);
  const metaExample = buildMetaDescription(p);

  return `You are an expert Pakistan e-commerce SEO copywriter for Maxx (Kharian), competing with Daraz and PriceOye.

Write UNIQUE, transactional product copy optimized for Google Search in Pakistan.

RULES:
- Plain text only. NO markdown, NO # headings, NO bullet lists, NO asterisks.
- SEO title max 60 characters. Pattern: "{Product} Price in Pakistan | {Brand} | Maxx" or include price like "${titleExample}".
- Meta description 120-160 characters. Must include: product name, price if known (${formatPKR(p.price || 0)}), "Cash on Delivery" or "COD", and a call to action.
- Focus keyword (transactional): "${focus}" — use naturally in title or meta, not stuffed.
- Description: 3-4 short paragraphs (200+ words total). Para 1 = what it is + main benefit. Para 2 = key specs as sentences. Para 3 = COD, delivery across Pakistan. Para 4 = trust (Maxx, Kharian, returns).
- Tags: 4-8 lowercase slugs (category, brand, product type, pakistan, cod).
- Do NOT invent specs not in the input. Use only provided specs.
- Category context: ${catLabel || 'general merchandise'}.

Return ONLY valid JSON with keys:
title, short, description, tags (array), seoTitle, metaDescription, focusKeyword

Product data:
${JSON.stringify({
    title: p.title,
    brand: p.brand,
    category: catLabel,
    subcategory: p.subcategory,
    price: p.price,
    mrp: p.mrp,
    short: p.short,
    description: p.description,
    specs: p.specs
  })}`;
}

/** Rich Product + Offer JSON-LD for Google rich results. */
export function buildProductSchema(p = {}, { rating, reviewCount } = {}) {
  const price = Number(p.price) || 0;
  const mrp = Number(p.mrp) || 0;
  const inStock = (Number(p.stock) || 0) > 0;
  const images = (p.images || []).filter(Boolean);
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.seo?.seoTitle ? p.title : p.title,
    description: stripMarkdownArtifacts(p.seo?.metaDescription || p.short || p.description || '').slice(0, 5000),
    sku: p.sku || p.id,
    mpn: p.sku || p.id,
    image: images.length ? images : undefined,
    brand: { '@type': 'Brand', name: p.brand || STORE },
    category: categoryLabel(p.category, p.subcategory) || undefined,
    offers: {
      '@type': 'Offer',
      url: `${SITE}/product/${p.slug}`,
      priceCurrency: 'PKR',
      price: String(price),
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: STORE }
    }
  };
  if (mrp > price && price > 0) {
    schema.offers.priceSpecification = {
      '@type': 'UnitPriceSpecification',
      price: String(price),
      priceCurrency: 'PKR',
      referenceQuantity: { '@type': 'QuantitativeValue', value: 1 }
    };
  }
  const rv = Number(rating ?? p.rating) || 0;
  const rc = Number(reviewCount ?? p.reviews) || 0;
  if (rc > 0 && rv > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: String(Math.min(5, Math.max(1, rv))),
      reviewCount: String(rc),
      bestRating: '5',
      worstRating: '1'
    };
  }
  return schema;
}

export function buildProductBreadcrumbSchema(p = {}) {
  const items = [
    { name: 'Shop', path: '/shop' },
    ...(p.category ? [{ name: categoryBySlug(p.category)?.name || p.category.replace(/-/g, ' '), path: `/category/${p.category}` }] : []),
    ...(p.subcategory ? [{ name: subcategoryBySlug(p.category, p.subcategory)?.name || p.subcategory, path: `/category/${p.category}/${p.subcategory}` }] : []),
    { name: p.title, path: `/product/${p.slug}` }
  ];
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: SITE + it.path
    }))
  };
}

export function buildProductPageSchema(p = {}, ratings = {}) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      buildProductSchema(p, ratings),
      buildProductBreadcrumbSchema(p)
    ]
  };
}

export { SITE, STORE };
