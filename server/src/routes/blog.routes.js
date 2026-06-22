import { Router } from 'express';
import { requireAuth } from '../auth.js';
import { requirePermission } from '../rbac.js';
import { query, queryOne } from '../db/pg.js';
import { logAudit } from '../audit.js';

const r = Router();

function fromRow(p) {
  if (!p) return null;
  return {
    id: p.id, slug: p.slug, title: p.title,
    cover: p.cover || '',
    content: p.content || '', sections: Array.isArray(p.sections) ? p.sections : [],
    summary: p.summary || '', date: p.date,
    author: p.author, category: p.category, status: p.status,
    tags: Array.isArray(p.tags) ? p.tags : [],
    faqs: Array.isArray(p.faqs) ? p.faqs : [],
    keywords: p.keywords || '',
    seo: p.seo || {}, readTime: p.read_time,
    createdAt: p.created_at, updatedAt: p.updated_at
  };
}

function fromRowList(p) {
  if (!p) return null;
  return {
    id: p.id, slug: p.slug, title: p.title,
    cover: p.cover || '',
    summary: p.summary || '', date: p.date,
    author: p.author, category: p.category, status: p.status,
    tags: Array.isArray(p.tags) ? p.tags : [],
    keywords: p.keywords || '',
    readTime: p.read_time,
    createdAt: p.created_at, updatedAt: p.updated_at
  };
}

// Public — published posts
r.get('/public', async (req, res, next) => {
  try {
    const { tag, category, limit = 20 } = req.query;
    let sql = `SELECT id, slug, title, cover, summary, date, author, category, status, tags, keywords, read_time, created_at, updated_at FROM blog_posts WHERE status = 'published'`;
    const vals = []; let i = 1;
    if (category) { sql += ` AND category = $${i++}`; vals.push(category); }
    if (tag)      { sql += ` AND tags @> $${i++}`;    vals.push(JSON.stringify([tag])); }
    sql += ` ORDER BY date DESC LIMIT $${i}`;
    vals.push(Number(limit));
    res.json({ posts: (await query(sql, vals)).map(fromRowList) });
  } catch (e) { next(e); }
});

// Public — single post by slug
r.get('/public/:slug', async (req, res, next) => {
  try {
    const row = await queryOne(`SELECT * FROM blog_posts WHERE slug = $1 AND status = 'published'`, [req.params.slug]);
    if (!row) return res.status(404).json({ error: 'Post not found' });
    res.json({ post: fromRow(row) });
  } catch (e) { next(e); }
});

r.get('/', requireAuth, requirePermission('blog'), async (_req, res, next) => {
  try {
    res.json({ posts: (await query('SELECT * FROM blog_posts ORDER BY date DESC')).map(fromRow) });
  } catch (e) { next(e); }
});

r.post('/', requireAuth, requirePermission('blog'), async (req, res, next) => {
  try {
    const d = req.body?.post || req.body || {};
    if (!d.title) return res.status(400).json({ error: 'Title is required' });
    const id = 'post-' + Date.now();
    const slug = d.slug || (d.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    await query(
      `INSERT INTO blog_posts (id,slug,title,cover,content,sections,summary,date,author,category,status,tags,faqs,keywords,seo,read_time,created_at,updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,NOW(),NOW())`,
      [id, slug, d.title, d.cover||'', d.content||'', JSON.stringify(d.sections||[]), d.summary||'', d.date||new Date().toISOString().slice(0,10), d.author||'Maxx Editorial', d.category||'', d.status||'draft', JSON.stringify(d.tags||[]), JSON.stringify(d.faqs||[]), d.keywords||'', JSON.stringify(d.seo||{}), d.readTime||5]
    );
    const saved = fromRow(await queryOne('SELECT * FROM blog_posts WHERE id = $1', [id]));
    logAudit(req, { action: 'blog.create', entity: 'blog', entityId: id, note: 'Created post: ' + d.title });
    res.json({ post: saved });
  } catch (e) { next(e); }
});

r.put('/:slug', requireAuth, requirePermission('blog'), async (req, res, next) => {
  try {
    const existing = await queryOne('SELECT id, title FROM blog_posts WHERE slug = $1', [req.params.slug]);
    if (!existing) return res.status(404).json({ error: 'Post not found' });
    const d = req.body?.post || req.body || {};
    const sets = []; const vals = []; let i = 1;
    const add = (col, val) => { sets.push(`${col} = $${i++}`); vals.push(val); };
    if (d.title    !== undefined) add('title',     d.title);
    if (d.slug     !== undefined) add('slug',      d.slug);
    if (d.cover    !== undefined) add('cover',     d.cover);
    if (d.content  !== undefined) add('content',   d.content);
    if (d.sections !== undefined) add('sections',  JSON.stringify(d.sections));
    if (d.summary  !== undefined) add('summary',   d.summary);
    if (d.date     !== undefined) add('date',      d.date);
    if (d.author   !== undefined) add('author',    d.author);
    if (d.category !== undefined) add('category',  d.category);
    if (d.status   !== undefined) add('status',    d.status);
    if (d.tags     !== undefined) add('tags',      JSON.stringify(d.tags));
    if (d.faqs     !== undefined) add('faqs',      JSON.stringify(d.faqs));
    if (d.keywords !== undefined) add('keywords',  d.keywords);
    if (d.seo      !== undefined) add('seo',       JSON.stringify(d.seo));
    if (d.readTime !== undefined) add('read_time', d.readTime);
    if (!sets.length) return res.json({ post: fromRow(existing) });
    sets.push('updated_at = NOW()'); vals.push(existing.id);
    const updated = fromRow(await queryOne(`UPDATE blog_posts SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals));
    logAudit(req, { action: 'blog.update', entity: 'blog', entityId: existing.id, note: 'Updated post' });
    res.json({ post: updated });
  } catch (e) { next(e); }
});

r.delete('/:slug', requireAuth, requirePermission('blog'), async (req, res, next) => {
  try {
    const row = await queryOne('SELECT id, title FROM blog_posts WHERE slug = $1', [req.params.slug]);
    if (!row) return res.status(404).json({ error: 'Post not found' });
    await query('DELETE FROM blog_posts WHERE id = $1', [row.id]);
    logAudit(req, { action: 'blog.delete', entity: 'blog', entityId: row.id, note: 'Deleted post: ' + row.title });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default r;
