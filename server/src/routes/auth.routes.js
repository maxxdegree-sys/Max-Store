import { Router } from 'express';
import { login, requireAuth } from '../auth.js';
import { logAudit } from '../audit.js';

const r = Router();

r.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  const result = await login(email, password);
  if (result.error) return res.status(401).json({ error: result.error });
  // Build a minimal req.user so the login is attributed in the audit log.
  req.user = result.user;
  logAudit(req, { action: 'login', entity: 'session', entityId: result.user.id, note: 'Signed in' });
  res.json(result);
});

r.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

r.post('/logout', requireAuth, (req, res) => {
  logAudit(req, { action: 'logout', entity: 'session', entityId: req.user.id, note: 'Signed out' });
  res.json({ ok: true });
});

export default r;
