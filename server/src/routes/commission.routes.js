import { Router } from 'express';
import { COMMISSION_SLABS, calculateCommission } from '../util/commission.js';

const r = Router();

r.get('/slabs', (_req, res) => {
  res.json({ slabs: COMMISSION_SLABS });
});

r.post('/calculate', (req, res) => {
  const price = Number(req.body?.price) || 0;
  if (price <= 0) return res.status(400).json({ error: 'Enter a valid product price.' });
  res.json({ price, ...calculateCommission(price) });
});

export default r;
