// Server-side image processing with sharp: validate -> auto-orient -> resize
// (aspect kept) -> WEBP convert -> write main + thumbnail, optional watermark.
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { PATHS } from '../store.js';

export const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

function datedDir() {
  const d = new Date();
  const rel = String(d.getFullYear()) + '/' + String(d.getMonth() + 1).padStart(2, '0');
  const dir = path.join(PATHS.UPLOAD_DIR, String(d.getFullYear()), String(d.getMonth() + 1).padStart(2, '0'));
  fs.mkdirSync(dir, { recursive: true });
  return { dir, rel };
}

// Returns { id, url, thumbUrl, width, height, bytes, originalWidth, originalHeight }.
export async function processImage(buffer, mime, { maxW = 1200, maxH = 1200, thumb = 500, watermark = null } = {}) {
  if (!ALLOWED_MIME.includes(mime)) throw new Error('Unsupported file type');
  const meta = await sharp(buffer).metadata();          // also validates it is a real image
  if (!meta.width || !meta.height) throw new Error('Not a valid image');

  const id = randomUUID();
  const { dir, rel } = datedDir();

  let pipeline = sharp(buffer).rotate().resize({ width: maxW, height: maxH, fit: 'inside', withoutEnlargement: true });
  if (watermark) {
    const svg = Buffer.from(
      '<svg width="360" height="70"><text x="12" y="48" font-size="30" fill="rgba(255,255,255,0.65)" ' +
      'font-family="sans-serif" font-weight="bold">' + String(watermark).replace(/[<>&]/g, '') + '</text></svg>'
    );
    pipeline = pipeline.composite([{ input: svg, gravity: 'southeast' }]);
  }
  const mainBuf = await pipeline.webp({ quality: 80 }).toBuffer();
  fs.writeFileSync(path.join(dir, id + '.webp'), mainBuf);

  const thumbBuf = await sharp(buffer).rotate()
    .resize({ width: thumb, height: thumb, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 72 }).toBuffer();
  fs.writeFileSync(path.join(dir, id + '_thumb.webp'), thumbBuf);

  const fin = await sharp(mainBuf).metadata();
  return {
    id,
    url: '/api/media/' + rel + '/' + id + '.webp',
    thumbUrl: '/api/media/' + rel + '/' + id + '_thumb.webp',
    width: fin.width, height: fin.height, bytes: mainBuf.length,
    originalWidth: meta.width, originalHeight: meta.height
  };
}

// Deletes a previously uploaded image (main + thumb). Path-traversal safe.
export function deleteByUrl(url) {
  const m = String(url || '').match(/\/api\/media\/(.+\.webp)$/);
  if (!m) return false;
  const rel = path.normalize(m[1]).replace(/^([.][.](\/|\\|$))+/, '');
  const file = path.join(PATHS.UPLOAD_DIR, rel);
  if (!file.startsWith(PATHS.UPLOAD_DIR)) return false;
  let ok = false;
  const targets = [file, file.replace(/\.webp$/, '_thumb.webp')];
  for (const f of targets) { if (fs.existsSync(f)) { fs.unlinkSync(f); ok = true; } }
  return ok;
}

export function storageUsage() {
  let bytes = 0, files = 0;
  const walk = (d) => {
    if (!fs.existsSync(d)) return;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else { bytes += fs.statSync(p).size; files += 1; }
    }
  };
  walk(PATHS.UPLOAD_DIR);
  return { bytes, files };
}
