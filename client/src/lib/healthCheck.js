/**
 * Startup connection health check.
 * Logs whether the Neon Auth endpoint and Data API endpoint are reachable.
 * Also exposed on window.__slotlyCheck() so you can run it from DevTools console.
 */

import { getJwt } from './auth.js';

const AUTH_URL     = import.meta.env.VITE_NEON_AUTH_URL;
const DATA_API_URL = import.meta.env.VITE_NEON_DATA_API_URL;

async function pingUrl(label, url, expectedStatuses = [200], headers = {}) {
  if (!url) {
    console.warn(`[Slotly] ${label}: ❌ env var missing`);
    return false;
  }
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(5000),
    });
    const ok = expectedStatuses.includes(res.status);
    const note = ok ? '' : ` (expected ${expectedStatuses.join('/')})`;
    console.log(`[Slotly] ${label}: ${ok ? '✅' : '⚠️'} HTTP ${res.status}${note}`);
    if (!ok) {
      const body = await res.text().catch(() => '');
      if (body) console.log(`[Slotly] ${label}: response`, body.slice(0, 300));
    }
    return true; // reachable regardless of status
  } catch (err) {
    console.error(`[Slotly] ${label}: ❌ unreachable — ${err.message}`);
    return false;
  }
}

export async function runHealthCheck() {
  console.group('[Slotly] Connection health check');
  console.log('Auth URL  :', AUTH_URL   || '(missing)');
  console.log('Data API  :', DATA_API_URL || '(missing)');
  await pingUrl('Neon Auth  endpoint', AUTH_URL ? `${AUTH_URL}/get-session` : null, [200, 401]);

  const jwt = await getJwt().catch(() => null);
  const headers = jwt ? { Authorization: `Bearer ${jwt}` } : {};
  // Use limit=1 so PostgREST doesn't reject the request on stricter configs.
  await pingUrl(
    'Neon Data API      ',
    DATA_API_URL ? `${DATA_API_URL}/profiles?select=id&limit=1` : null,
    [200, 401, 403],
    headers
  );
  console.groupEnd();
}

// Expose for manual use in DevTools: __slotlyCheck()
if (typeof window !== 'undefined') {
  window.__slotlyCheck = runHealthCheck;
  console.log('[Slotly] Run window.__slotlyCheck() in console to re-run health check.');
}
