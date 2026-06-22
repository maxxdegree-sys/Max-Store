// Role-based access guards. Uses the shared permission helpers so server and
// client enforce identical rules.
import { can, isExecutive } from '../../src/utils/permissions.js';
import { getSetting } from './store.js';

export function requirePermission(key) {
  return (req, res, next) => {
    const perms = req.user?.permissions || [];
    if (!can(perms, key)) {
      return res.status(403).json({ error: 'You do not have permission for this section.' });
    }
    next();
  };
}

export function requireExecutive(req, res, next) {
  if (!isExecutive(req.user?.permissions || [])) {
    return res.status(403).json({ error: 'Executive access only.' });
  }
  next();
}

// Import is allowed for executives, or for users the executive has granted.
export function requireImportAccess(req, res, next) {
  const perms = req.user?.permissions || [];
  if (isExecutive(perms)) return next();
  getSetting('import').then((importSettings) => {
    const allowed = importSettings?.allowedUserIds || [];
    if (importSettings?.enabled && allowed.includes(req.user?.id)) return next();
    return res.status(403).json({ error: 'Smart import is restricted. Ask an executive for access.' });
  }).catch(() => res.status(403).json({ error: 'Smart import is restricted. Ask an executive for access.' }));
}
