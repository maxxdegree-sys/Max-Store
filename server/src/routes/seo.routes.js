import { Router } from 'express';
import { requireAuth } from '../auth.js';
import { requirePermission } from '../rbac.js';
import { seoScore, articleSchema, faqSchema, breadcrumbSchema, productSchema } from '../util/seo.js';

const r = Router();
r.use(requireAuth, requirePermission('blog'));

r.post('/score', (req, res) => res.json(seoScore(req.body?.blog || {}, req.body?.meta || {})));

r.post('/schema/:type', (req, res) => {
  const b = req.body || {};
  const t = req.params.type;
  let schema;
  if (t === 'article') schema = articleSchema(b.blog || b);
  else if (t === 'faq') schema = faqSchema(b.faqs || []);
  else if (t === 'breadcrumb') schema = breadcrumbSchema(b.items || []);
  else if (t === 'product') schema = productSchema(b.product || b);
  else return res.status(400).json({ error: 'Unknown schema type' });
  res.json({ schema });
});

export default r;
