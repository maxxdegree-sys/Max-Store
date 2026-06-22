import { Router } from 'express';
import { requireAuth } from '../auth.js';
import { requirePermission } from '../rbac.js';
import { logAudit } from '../audit.js';
import * as ai from '../services/ai.js';

const r = Router();
r.use(requireAuth, requirePermission('blog'));

r.get('/mode', (_req, res) => res.json({ mode: ai.aiMode() }));

r.post('/generate/blog', async (req, res, next) => {
  try { const out = await ai.generateBlog(req.body || {}); logAudit(req, { action: 'ai.generate', entity: 'blog', note: 'Generated blog draft (' + out.mode + ')' }); res.json(out); }
  catch (e) { next(e); }
});
r.post('/generate/title', async (req, res, next) => { try { res.json({ titles: await ai.seoTitles(req.body || {}) }); } catch (e) { next(e); } });
r.post('/generate/meta', async (req, res, next) => { try { res.json(await ai.metaDescription(req.body || {})); } catch (e) { next(e); } });
r.post('/generate/faq', async (req, res, next) => { try { res.json({ faqs: await ai.faqs(req.body || {}) }); } catch (e) { next(e); } });
r.post('/suggest/keywords', async (req, res, next) => { try { res.json({ keywords: await ai.keywordIdeas(req.body || {}) }); } catch (e) { next(e); } });

// Real-time analysis (synchronous, no API call needed)
r.post('/analyze/semantic', (req, res) => res.json(ai.semanticAnalysis(req.body || {})));
r.post('/score/content', (req, res) => res.json(ai.contentScore(req.body || {})));
r.post('/suggest/links', (req, res) => res.json({ links: ai.internalLinks(req.body || {}) }));

export default r;
