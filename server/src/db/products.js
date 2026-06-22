import { randomUUID } from 'crypto';
import { query, queryOne } from './pg.js';

function fromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    sku: row.sku || '',
    slug: row.slug,
    title: row.title,
    brand: row.brand || '',
    category: row.category || '',
    subcategory: row.subcategory || '',
    price: Number(row.price) || 0,
    mrp: Number(row.mrp) || 0,
    costPrice: Number(row.cost_price) || 0,
    stock: Number(row.stock) || 0,
    sold: Number(row.sold) || 0,
    supplier: row.supplier || '',
    status: row.status || 'active',
    short: row.short || '',
    description: row.description || '',
    specs: row.specs || {},
    tags: Array.isArray(row.tags) ? row.tags : [],
    variants: Array.isArray(row.variants) ? row.variants : [],
    images: Array.isArray(row.images) ? row.images : [],
    keywords: row.keywords || '',
    seo: {
      seoTitle: row.seo_title || '',
      metaDescription: row.meta_description || '',
      focusKeyword: row.focus_keyword || ''
    },
    source: row.source || '',
    sourceUrl: row.source_url || '',
    vendorId: row.vendor_id || null,
    displayRank: row.display_rank ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    rating: 0,
    reviews: 0
  };
}

// Card/grid fields only — omits description, specs, variants, SEO, etc.
function fromRowSlim(row) {
  if (!row) return null;
  const images = Array.isArray(row.images) ? row.images : [];
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    brand: row.brand || '',
    category: row.category || '',
    subcategory: row.subcategory || '',
    price: Number(row.price) || 0,
    mrp: Number(row.mrp) || 0,
    stock: Number(row.stock) || 0,
    sold: Number(row.sold) || 0,
    short: row.short || '',
    tags: Array.isArray(row.tags) ? row.tags : [],
    images: images[0] ? [images[0]] : [],
    displayRank: row.display_rank ?? null,
    rating: 0,
    reviews: 0
  };
}

// Real, approved-review aggregates keyed by product id.
async function ratingMap(productIds = []) {
  if (!productIds.length) return {};
  const rows = await query(
    `SELECT product_id, AVG(rating)::float AS avg, COUNT(*)::int AS cnt
       FROM reviews WHERE status = 'approved' AND product_id = ANY($1)
       GROUP BY product_id`,
    [productIds]
  );
  const m = {};
  rows.forEach((r) => { m[r.product_id] = { rating: Math.round((r.avg || 0) * 10) / 10, reviews: r.cnt || 0 }; });
  return m;
}

function applyRating(product, m) {
  if (!product) return product;
  const agg = m[product.id];
  if (agg) { product.rating = agg.rating; product.reviews = agg.reviews; }
  return product;
}

function orderClause(sort) {
  switch (sort) {
    case 'price-asc':  return 'price ASC NULLS LAST, id ASC';
    case 'price-desc': return 'price DESC NULLS LAST, id ASC';
    case 'rating':
      return `(SELECT COALESCE(AVG(r.rating), 0) FROM reviews r WHERE r.product_id = products.id AND r.status = 'approved') DESC, sold DESC`;
    case 'newest':
      return `(tags @> '["new-arrival"]'::jsonb) DESC, created_at DESC`;
    case 'best-selling':
      return 'sold DESC NULLS LAST, display_rank ASC NULLS LAST, id ASC';
    default:
      return 'display_rank ASC NULLS LAST, sold DESC, created_at DESC';
  }
}

// Ranked products (lowest display_rank) come first; unranked ones follow, newest first.
export async function listProducts({
  activeOnly = false,
  slim = false,
  page,
  limit,
  category,
  subcategory,
  tag,
  sale,
  q,
  brands,
  maxPrice,
  sort = 'popular'
} = {}) {
  const conditions = [];
  const vals = [];
  let i = 1;

  if (activeOnly) conditions.push(`status = 'active'`);
  if (category) { conditions.push(`category = $${i++}`); vals.push(category); }
  if (subcategory) { conditions.push(`subcategory = $${i++}`); vals.push(subcategory); }
  if (tag) { conditions.push(`tags @> $${i++}::jsonb`); vals.push(JSON.stringify([tag])); }
  if (sale === 'flash') { conditions.push(`tags @> $${i++}::jsonb`); vals.push(JSON.stringify(['flash-sale'])); }
  if (maxPrice != null && maxPrice !== '') {
    conditions.push(`price <= $${i++}`);
    vals.push(Number(maxPrice));
  }
  if (brands?.length) {
    conditions.push(`brand = ANY($${i++})`);
    vals.push(brands);
  }
  if (q) {
    conditions.push(`(title ILIKE $${i} OR brand ILIKE $${i} OR category ILIKE $${i})`);
    vals.push('%' + q + '%');
    i++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const countRow = await queryOne(`SELECT COUNT(*)::int AS cnt FROM products ${where}`, vals);
  const total = countRow?.cnt ?? 0;

  let sql = `SELECT * FROM products ${where} ORDER BY ${orderClause(sort)}`;
  const queryVals = [...vals];
  const paginated = page != null && limit != null;
  if (paginated) {
    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(100, Math.max(1, Number(limit) || 48));
    sql += ` LIMIT $${i++} OFFSET $${i++}`;
    queryVals.push(l, (p - 1) * l);
  }

  const rows = await query(sql, queryVals);
  const mapper = slim ? fromRowSlim : fromRow;
  let products = rows.map(mapper);
  const m = await ratingMap(products.map((p) => p.id));
  products = products.map((p) => applyRating(p, m));

  if (paginated) {
    return {
      products,
      total,
      page: Math.max(1, Number(page) || 1),
      limit: Math.min(100, Math.max(1, Number(limit) || 48))
    };
  }
  return { products, total };
}

export async function findProduct(id) {
  const row = await queryOne('SELECT * FROM products WHERE id = $1', [id]);
  const p = fromRow(row);
  return p ? applyRating(p, await ratingMap([p.id])) : p;
}

export async function findProductBySlug(slug) {
  const row = await queryOne('SELECT * FROM products WHERE slug = $1', [slug]);
  const p = fromRow(row);
  return p ? applyRating(p, await ratingMap([p.id])) : p;
}

export async function createProduct(p = {}) {
  const id = p.id || ('p-' + Date.now());
  const slug = p.slug || (p.title || id).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const seo = p.seo || {};
  const row = await queryOne(
    `INSERT INTO products
       (id,sku,slug,title,brand,category,subcategory,price,mrp,cost_price,stock,sold,supplier,status,short,description,specs,tags,variants,images,keywords,seo_title,meta_description,focus_keyword,source,source_url,vendor_id,display_rank,created_at,updated_at)
     VALUES
       ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,NOW(),NOW())
     RETURNING *`,
    [
      id,
      p.sku || '',
      slug,
      p.title,
      p.brand || '',
      p.category || '',
      p.subcategory || '',
      Number(p.price) || 0,
      Number(p.mrp) || Number(p.price) || 0,
      Number(p.costPrice) || 0,
      Number(p.stock) || 0,
      Number(p.sold) || 0,
      p.supplier || '',
      p.status || 'active',
      p.short || '',
      p.description || '',
      JSON.stringify(p.specs || {}),
      JSON.stringify(Array.isArray(p.tags) ? p.tags : []),
      JSON.stringify(Array.isArray(p.variants) ? p.variants : []),
      JSON.stringify(Array.isArray(p.images) ? p.images.filter(Boolean) : []),
      p.keywords || '',
      seo.seoTitle || '',
      seo.metaDescription || '',
      seo.focusKeyword || '',
      p.source || '',
      p.sourceUrl || '',
      p.vendorId || null,
      p.displayRank == null || p.displayRank === '' ? null : Number(p.displayRank)
    ]
  );
  return fromRow(row);
}

export async function updateProductRecord(id, patch = {}) {
  const seo = patch.seo || {};
  const sets = [];
  const vals = [];
  let i = 1;

  const add = (col, val) => { sets.push(`${col} = $${i++}`); vals.push(val); };

  if (patch.title       !== undefined) add('title',            patch.title);
  if (patch.sku         !== undefined) add('sku',              patch.sku);
  if (patch.slug        !== undefined) add('slug',             patch.slug);
  if (patch.brand       !== undefined) add('brand',            patch.brand);
  if (patch.category    !== undefined) add('category',         patch.category);
  if (patch.subcategory !== undefined) add('subcategory',      patch.subcategory);
  if (patch.price       !== undefined) add('price',            Number(patch.price));
  if (patch.mrp         !== undefined) add('mrp',              Number(patch.mrp));
  if (patch.costPrice   !== undefined) add('cost_price',       Number(patch.costPrice));
  if (patch.stock       !== undefined) add('stock',            Number(patch.stock));
  if (patch.sold        !== undefined) add('sold',             Number(patch.sold));
  if (patch.supplier    !== undefined) add('supplier',         patch.supplier);
  if (patch.status      !== undefined) add('status',           patch.status);
  if (patch.short       !== undefined) add('short',            patch.short);
  if (patch.description !== undefined) add('description',      patch.description);
  if (patch.specs       !== undefined) add('specs',            JSON.stringify(patch.specs));
  if (patch.tags        !== undefined) add('tags',             JSON.stringify(patch.tags));
  if (patch.variants    !== undefined) add('variants',         JSON.stringify(patch.variants));
  if (patch.images      !== undefined) add('images',           JSON.stringify(patch.images));
  if (patch.keywords    !== undefined) add('keywords',         patch.keywords);
  if (patch.source      !== undefined) add('source',           patch.source);
  if (patch.sourceUrl   !== undefined) add('source_url',       patch.sourceUrl);
  if (patch.vendorId    !== undefined) add('vendor_id',        patch.vendorId);
  if (patch.displayRank !== undefined) add('display_rank',     patch.displayRank == null || patch.displayRank === '' ? null : Number(patch.displayRank));
  if (seo.seoTitle       !== undefined) add('seo_title',        seo.seoTitle);
  if (seo.metaDescription!== undefined) add('meta_description', seo.metaDescription);
  if (seo.focusKeyword   !== undefined) add('focus_keyword',    seo.focusKeyword);

  if (!sets.length) return findProduct(id);

  sets.push(`updated_at = NOW()`);
  vals.push(id);
  const row = await queryOne(
    `UPDATE products SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
    vals
  );
  return fromRow(row);
}

export async function deleteProductRecord(id) {
  await query('DELETE FROM products WHERE id = $1', [id]);
  return true;
}
