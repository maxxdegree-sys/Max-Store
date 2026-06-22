// Smart product scraper. Fetches a PUBLIC product URL server-side (no browser
// CORS limits) and extracts structured fields from JSON-LD, OpenGraph and
// standard meta tags. Includes SSRF protection against internal hosts.
import * as cheerio from 'cheerio';

const PRIVATE_HOST = /^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.0\.0\.0|::1|\[::1\])/i;
const PRIVATE_172 = /^172\.(1[6-9]|2[0-9]|3[0-1])\./;

export function validateUrl(raw) {
  let u;
  try { u = new URL(raw); } catch { return { error: 'That is not a valid URL.' }; }
  if (!/^https?:$/.test(u.protocol)) return { error: 'Only http and https URLs are allowed.' };
  const host = u.hostname;
  if (PRIVATE_HOST.test(host) || PRIVATE_172.test(host)) {
    return { error: 'Internal / private addresses are not allowed.' };
  }
  return { url: u.toString() };
}

function num(v) {
  if (v == null) return null;
  const n = parseFloat(String(v).replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : null;
}

function firstJsonLdProduct($) {
  let found = null;
  $('script[type="application/ld+json"]').each((_, el) => {
    if (found) return;
    let json;
    try { json = JSON.parse($(el).contents().text()); } catch { return; }
    const arr = Array.isArray(json) ? json : (json['@graph'] ? json['@graph'] : [json]);
    for (const item of arr) {
      const t = item && item['@type'];
      const types = Array.isArray(t) ? t : [t];
      if (types.includes('Product')) { found = item; break; }
    }
  });
  return found;
}

// Pure extraction from an HTML string. Separated from fetch so it is testable.
export function parseHtml(html, sourceUrl = '') {
  const $ = cheerio.load(html);
  const og = (p) => $('meta[property="' + p + '"]').attr('content') || $('meta[name="' + p + '"]').attr('content') || '';
  const ld = firstJsonLdProduct($) || {};

  const title = (ld.name || og('og:title') || $('h1').first().text().trim() || $('title').text().trim() || '').slice(0, 200);

  let description = ld.description || og('og:description') || og('description') || '';
  description = description.toString().trim().slice(0, 4000);

  const images = [];
  const pushImg = (src) => { if (src && /^https?:\/\//.test(src) && !images.includes(src)) images.push(src); };
  if (ld.image) (Array.isArray(ld.image) ? ld.image : [ld.image]).forEach((im) => pushImg(typeof im === 'string' ? im : im?.url));
  $('meta[property="og:image"]').each((_, el) => pushImg($(el).attr('content')));
  if (images.length < 4) {
    $('img').slice(0, 30).each((_, el) => {
      let s = $(el).attr('src') || $(el).attr('data-src');
      if (s && s.startsWith('//')) s = 'https:' + s;
      if (s && /\.(jpg|jpeg|png|webp)/i.test(s)) pushImg(s);
    });
  }

  const offers = Array.isArray(ld.offers) ? ld.offers[0] : ld.offers;
  const price = num(offers?.price) || num(og('product:price:amount')) || num(og('og:price:amount'));
  const mrp = num(offers?.highPrice) || num(offers?.priceSpecification?.price) || null;

  const brand = (typeof ld.brand === 'object' ? ld.brand?.name : ld.brand) || og('product:brand') || '';
  const sku = ld.sku || ld.mpn || '';
  const specs = {};
  if (Array.isArray(ld.additionalProperty)) {
    ld.additionalProperty.forEach((p) => { if (p?.name) specs[p.name] = p.value; });
  }

  return {
    sourceUrl,
    title,
    description,
    images: images.slice(0, 8),
    price: price || null,
    mrp: mrp || null,
    brand: (brand || '').toString().slice(0, 80),
    sku: (sku || '').toString().slice(0, 60),
    category: (og('product:category') || '').toString(),
    specs,
    raw: { hadJsonLd: !!ld.name, imageCount: images.length }
  };
}

export async function fetchAndParse(rawUrl, { timeoutMs = 12000 } = {}) {
  const v = validateUrl(rawUrl);
  if (v.error) return v;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  let html;
  try {
    const resp = await fetch(v.url, {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AlRafiqImporter/1.0)',
        'Accept': 'text/html,application/xhtml+xml'
      }
    });
    if (!resp.ok) return { error: 'The page returned status ' + resp.status + '.' };
    const ct = resp.headers.get('content-type') || '';
    if (!ct.includes('html')) return { error: 'That URL is not an HTML page.' };
    html = await resp.text();
  } catch (e) {
    if (e.name === 'AbortError') return { error: 'The page took too long to respond.' };
    return { error: 'Could not reach that URL: ' + e.message };
  } finally {
    clearTimeout(timer);
  }
  return parseHtml(html, v.url);
}
