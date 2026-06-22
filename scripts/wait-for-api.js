// Waits for the API + database before starting Vite (used by dev:all).
const HEALTH_URL = 'http://localhost:4000/api/health';
const DEADLINE_MS = 90_000;
const POLL_MS = 500;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const deadline = Date.now() + DEADLINE_MS;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(HEALTH_URL);
      const data = await res.json();
      if (data?.db) {
        console.log('[wait-for-api] Database ready');
        return;
      }
    } catch {
      // API not listening yet — keep polling.
    }
    await sleep(POLL_MS);
  }
  console.error('[wait-for-api] Timed out waiting for API/database');
  process.exit(1);
}

main();
