import { Router } from 'express';
import { requireAuth } from '../auth.js';
import { requirePermission } from '../rbac.js';
import { query, queryOne } from '../db/pg.js';
import { logAudit } from '../audit.js';

const r = Router();

// Default editable site content. Stored value (settings key 'site') is merged
// over these, so missing fields always fall back to a sensible default.
const DEFAULT_SITE = {
  announcements: [
    { icon: 'Sparkles', text: '🎉 Flash Sale Live — Up to 50% OFF on premium products' },
    { icon: 'Truck',    text: 'Free Delivery across Pakistan on every order' },
    { icon: 'Mail',     text: 'Questions? Email support@maxxdegree.com' }
  ],
  flashSale: { enabled: true, title: '⚡ Flash Sale Live Now', endsAt: '' },
  homepage: {
    sectionLimit: 8,
    bestSellersMode: 'manual',
    sections: {
      featured: { enabled: true },
      trending: { enabled: true },
      newArrivals: { enabled: true },
      bestSellers: { enabled: true }
    }
  },
  testimonials: [
    { id: 1, name: 'Ayesha Khan',   city: 'Lahore',     rating: 5, text: 'Bohat acha experience tha — packaging premium thi aur delivery sirf 2 din mein.', avatar: 'https://i.pravatar.cc/100?img=47' },
    { id: 2, name: 'Hamza Riaz',    city: 'Islamabad',  rating: 5, text: 'Genuine products at honest prices. Maxx has become my default for kitchen stuff.', avatar: 'https://i.pravatar.cc/100?img=12' },
    { id: 3, name: 'Sana Tariq',    city: 'Karachi',    rating: 4, text: 'Loved the dinner set! Quality matches the photos. COD process was smooth.', avatar: 'https://i.pravatar.cc/100?img=32' },
    { id: 4, name: 'Bilal Ahmed',   city: 'Faisalabad', rating: 5, text: 'Email se order confirm mil gaya same day. Customer service top notch.', avatar: 'https://i.pravatar.cc/100?img=15' },
    { id: 5, name: 'Mariam Yousaf', city: 'Multan',     rating: 5, text: 'Imported items genuine hain. Pricing Daraz se bhi behtar mili kuch products pe.', avatar: 'https://i.pravatar.cc/100?img=49' }
  ],
  about: { customers: '50K+', products: '1.2K+', rating: '4.8' }
};

async function readSite() {
  const row = await queryOne('SELECT value FROM settings WHERE key = $1', ['site']);
  const stored = (row && row.value) || {};
  return { ...DEFAULT_SITE, ...stored };
}

// Public — storefront reads editable site content.
r.get('/site', async (_req, res, next) => {
  try {
    res.json({ site: await readSite() });
  } catch (e) { next(e); }
});

// Admin — update site content (gated by the 'banners' content permission).
r.put('/site', requireAuth, requirePermission('banners'), async (req, res, next) => {
  try {
    const body = req.body?.site || req.body || {};
    const next_ = { ...(await readSite()), ...body };
    await query(
      `INSERT INTO settings (key, value) VALUES ('site', $1)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [JSON.stringify(next_)]
    );
    logAudit(req, { action: 'settings.update', entity: 'settings', entityId: 'site', note: 'Updated site content' }).catch(() => {});
    res.json({ site: next_ });
  } catch (e) { next(e); }
});

export default r;
