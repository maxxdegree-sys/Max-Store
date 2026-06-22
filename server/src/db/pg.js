import pg from 'pg';
const { Pool } = pg;

let _pool = null;
let _poolEnding = null;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Neon pooler + idle disconnects can leave stale sockets in the pool.
function isRetryableDbError(err) {
  if (!err) return false;
  const code = err.code || err.errno;
  if (['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'EPIPE', '57P01', '08006', '08003', '53300'].includes(code)) {
    return true;
  }
  const msg = String(err.message || '');
  return /connection terminated|connection timeout|terminated unexpectedly|ECONNRESET/i.test(msg);
}

async function resetPool() {
  if (!_pool) return;
  if (!_poolEnding) {
    _poolEnding = _pool.end().catch(() => {}).finally(() => {
      _pool = null;
      _poolEnding = null;
    });
  }
  await _poolEnding;
}

function getPool() {
  if (_pool) return _pool;

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set. Check server/.env');

  // channel_binding=require breaks some Node pg clients on Windows — strip it.
  const connectionString = url.replace(/[&?]channel_binding=[^&]*/gi, '');

  _pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 10,
    // Release idle clients before Neon/pooler drops them.
    idleTimeoutMillis: 20_000,
    // Neon cold starts can take longer than 5s.
    connectionTimeoutMillis: 20_000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10_000
  });

  _pool.on('error', (err) => {
    console.error('[pg] idle client error:', err.message);
  });

  return _pool;
}

export async function query(sql, params, attempt = 0) {
  try {
    const { rows } = await getPool().query(sql, params);
    return rows;
  } catch (err) {
    if (attempt < 2 && isRetryableDbError(err)) {
      console.warn(`[pg] retrying query (${attempt + 1}/2):`, err.message);
      await resetPool();
      await sleep(400 * (attempt + 1));
      return query(sql, params, attempt + 1);
    }
    throw err;
  }
}

export async function queryOne(sql, params) {
  const rows = await query(sql, params);
  return rows[0] ?? null;
}

export default { query, queryOne };
