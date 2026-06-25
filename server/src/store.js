// Settings and misc helpers backed by PostgreSQL.
// The old JSON flat-file store has been replaced entirely.
import path from 'path';
import { fileURLToPath } from 'url';
import { query, queryOne } from './db/pg.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// UPLOAD_DIR can be overridden via env so uploads live on a persistent volume
// (e.g. a Railway volume) instead of the ephemeral container filesystem, which
// is wiped on every redeploy/restart. Defaults to the in-app path for local dev.
export const PATHS = {
  UPLOAD_DIR: process.env.UPLOAD_DIR
    ? path.resolve(process.env.UPLOAD_DIR)
    : path.join(__dirname, '..', 'data', 'uploads')
};

export async function getSetting(key) {
  const row = await queryOne('SELECT value FROM settings WHERE key = $1', [key]);
  return row ? row.value : null;
}

export async function setSetting(key, value) {
  await query(
    `INSERT INTO settings (key, value, updated_at) VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [key, JSON.stringify(value)]
  );
}

export async function getAllSettings() {
  const rows = await query('SELECT key, value FROM settings');
  const out = {};
  for (const r of rows) out[r.key] = r.value;
  return out;
}
