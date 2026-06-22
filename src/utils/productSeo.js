// Pakistan e-commerce product SEO — client mirror of server engine (offline scoring + optimize).
import { categoryBySlug, categoryLabel, subcategoryBySlug } from '../data/categories';

export function stripMarkdownArtifacts(text = '') {
  let s = String(text || '');
  s = s.replace(/^#{1,6}\s+/gm, '');
  s = s.replace(/\*\*([^*]+)\*\*/g, '$1');
  s = s.replace(/\*([^*]+)\*/g, '$1');
  s = s.replace(/^\s*[-*•]\s+/gm, '');
  return s.replace(/\n{3,}/g, '\n\n').replace(/[ \t]+/g, ' ').trim();
}

function formatPKR(n) {
  return 'Rs. ' + Math.round(Number(n) || 0).toLocaleString('en-PK');
}

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
  return `Specifications: ${Object.entries(p.specs).slice(0, 6).map(([k, v]) => `${k}: ${v}`).join('. ')}.`;
}

export function buildProductDescription(p = {}) {
  const title = (p.title || 'Product').trim();
  const brand = (p.brand || 'Maxx').trim();
  const catLabel = categoryLabel(p.category, p.subcategory) || 'everyday essentials';
  const focus = deriveFocusKeyword(p);
  const price = Number(p.price) || 0;
  const existing = stripMarkdownArtifacts(p.description || '');
  if (existing.length >= 200 && existing.toLowerCase().includes(focus.split(' ')[0])) return existing;

  return [
    `The ${title} from ${brand} is a top choice for shoppers looking for ${focus} with reliable quality and value. Ideal for ${catLabel.toLowerCase()} needs across Pakistani homes.`,
    specParagraph(p),
    price > 0 ? `Available at ${formatPKR(price)} with Cash on Delivery and fast shipping across Pakistan including Lahore, Karachi, Islamabad and Kharian.` : 'Available with Cash on Delivery and fast shipping across Pakistan.',
    'Maxx offers genuine products, easy returns on eligible items, and friendly support by email. Order online today for fast delivery across Pakistan.'
  ].filter(Boolean).join('\n\n');
}

export function buildProductTags(p = {}) {
  const tags = new Set([...(p.tags || [])]);
  if (p.category) tags.add(p.category);
  if (p.subcategory) tags.add(p.subcategory);
  if (p.brand) tags.add(p.brand.toLowerCase().replace(/\s+/g, '-'));
  tags.add('pakistan');
  tags.add('cod');
  return Array.from(tags).filter(Boolean).slice(0, 8);
}

export function localOptimizeProduct(p = {}) {
  const title = (p.title || 'Product').trim();
  const focusKeyword = deriveFocusKeyword(p);
  const seoTitle = buildSeoTitle(p);
  const metaDescription = buildMetaDescription(p);
  const short = (p.short && stripMarkdownArtifacts(p.short).length >= 20)
    ? stripMarkdownArtifacts(p.short)
    : `Shop ${title} (${p.brand || 'Maxx'}) — ${categoryLabel(p.category, p.subcategory) || 'quality product'} with Cash on Delivery across Pakistan.`;
  const description = buildProductDescription({ ...p, short });
  const tags = buildProductTags(p);
  return { title, short, description, tags, seo: { seoTitle, metaDescription, focusKeyword } };
}

// Industry product SEO scoring
export function productSeoScore(p = {}) {
  const seo = p.seo || {};
  const seoTitle = seo.seoTitle || '';
  const meta = seo.metaDescription || '';
  const desc = stripMarkdownArtifacts(p.description || '');
  const focus = (seo.focusKeyword || deriveFocusKeyword(p)).toLowerCase();
  const imgs = (p.images || []).filter(Boolean);
  const specCount = p.specs ? Object.keys(p.specs).length : 0;
  const price = Number(p.price) || 0;
  const titleLower = seoTitle.toLowerCase();
  const metaLower = meta.toLowerCase();
  const descLower = desc.toLowerCase();

  const checks = [];
  const add = (ok, weight, fix) => checks.push({ ok: !!ok, weight, fix });

  add(seoTitle.length >= 30 && seoTitle.length <= 60, 12, 'SEO title should be 30-60 chars with product + Pakistan/price signal.');
  add(/pakistan|rs\.?\s*\d|price/i.test(seoTitle), 8, 'Include "Pakistan" or price in the SEO title for local search.');
  add((p.short || '').length >= 25, 8, 'Add a short description (25+ characters) with a clear benefit.');
  add(desc.length >= 200, 14, 'Write a fuller description (200+ characters, 3-4 paragraphs).');
  add(imgs.length >= 2, 10, 'Add at least 2 product images with descriptive alt text.');
  add(specCount >= 2, 8, 'Add at least 2 specifications (helps Google Shopping).');
  add(meta.length >= 120 && meta.length <= 160, 12, 'Meta description should be 120-160 characters.');
  add(/cod|cash on delivery/i.test(metaLower), 8, 'Mention Cash on Delivery (COD) in the meta description.');
  add(price > 0 && (metaLower.includes('rs') || metaLower.includes(String(price))), 8, 'Include the price in the meta description.');
  add(!!focus && (titleLower.includes(focus.split(' ')[0]) || metaLower.includes(focus.split(' ')[0]) || descLower.includes(focus)), 10, `Use focus keyword "${focus}" in title, meta, or description.`);
  add(!!p.category, 6, 'Assign a product category for category SEO.');
  add((p.brand || '').length >= 2 && descLower.includes((p.brand || '').toLowerCase()), 6, 'Mention the brand name in the description.');

  const total = checks.reduce((a, c) => a + c.weight, 0);
  const got = checks.reduce((a, c) => a + (c.ok ? c.weight : 0), 0);
  const score = Math.round((got / total) * 100);
  const label = score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : score >= 50 ? 'Needs work' : 'Poor';
  return { score, label, issues: checks.filter((c) => !c.ok).map((c) => c.fix), focusKeyword: focus };
}

export const seoBadgeClass = (s) =>
  s >= 85 ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-200'
  : s >= 55 ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
  : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200';

const SITE = 'https://alrafiq.pk';
const STORE = 'Maxx';

/** Rich Product + Breadcrumb JSON-LD for product detail pages. */
export function buildProductPageSchema(p = {}, { rating, reviewCount } = {}) {
  const price = Number(p.price) || 0;
  const inStock = (Number(p.stock) || 0) > 0;
  const images = (p.images || []).filter(Boolean);
  const rv = Number(rating ?? p.rating) || 0;
  const rc = Number(reviewCount ?? p.reviews) || 0;

  const product = {
    '@type': 'Product',
    name: p.title,
    description: stripMarkdownArtifacts(p.seo?.metaDescription || p.short || p.description || '').slice(0, 5000),
    sku: p.sku || p.id,
    image: images.length ? images : undefined,
    brand: { '@type': 'Brand', name: p.brand || STORE },
    category: categoryLabel(p.category, p.subcategory) || undefined,
    offers: {
      '@type': 'Offer',
      url: `${SITE}/product/${p.slug}`,
      priceCurrency: 'PKR',
      price: String(price),
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: STORE }
    }
  };
  if (rc > 0 && rv > 0) {
    product.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: String(Math.min(5, Math.max(1, rv))),
      reviewCount: String(rc),
      bestRating: '5',
      worstRating: '1'
    };
  }

  const crumbs = [
    { name: 'Shop', path: '/shop' },
    ...(p.category ? [{ name: categoryBySlug(p.category)?.name || p.category, path: `/category/${p.category}` }] : []),
    ...(p.subcategory ? [{ name: subcategoryBySlug(p.category, p.subcategory)?.name || p.subcategory, path: `/category/${p.category}/${p.subcategory}` }] : []),
    { name: p.title, path: `/product/${p.slug}` }
  ];

  return {
    '@context': 'https://schema.org',
    '@graph': [
      product,
      {
        '@type': 'BreadcrumbList',
        itemListElement: crumbs.map((it, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: it.name,
          item: SITE + it.path
        }))
      }
    ]
  };
}

/** Descriptive image alt for SEO + accessibility. */
export function productImageAlt(p = {}, index = 0) {
  const brand = p.brand ? ` ${p.brand}` : '';
  const cat = categoryLabel(p.category, p.subcategory);
  const suffix = index > 0 ? ` — view ${index + 1}` : '';
  return `${p.title}${brand}${cat ? `, ${cat}` : ''} — buy online Pakistan${suffix}`;
}
