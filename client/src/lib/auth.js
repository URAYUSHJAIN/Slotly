/**
 * Slotly — Neon Auth client.
 *
 * Uses @neondatabase/auth with the BetterAuthReactAdapter so we get:
 *   - authClient.signUp.email({ email, password, name })
 *   - authClient.signIn.email({ email, password })
 *   - authClient.signOut()
 *   - authClient.useSession()                  ← React hook
 *   - authClient.getSession()                  ← imperative
 *
 * `getJwt()` reaches into Better Auth's session store and pulls the JWT
 * we hand to the Data API for RLS-protected queries.
 */
import { createAuthClient } from '@neondatabase/auth';
import { BetterAuthReactAdapter } from '@neondatabase/auth/react/adapters';

const url = import.meta.env.VITE_NEON_AUTH_URL;
if (!url) {
  throw new Error(
    'VITE_NEON_AUTH_URL is missing. Set it in client/.env.local and restart `npm run dev`.'
  );
}

export const authClient = createAuthClient(url, {
  adapter: BetterAuthReactAdapter(),
});

/**
 * Returns the current user's JWT, or `null` when signed out.
 * The Better Auth client stores the token in its session; we read it via
 * the public getSession() method so we don't depend on internals.
 */
export async function getJwt() {
  try {
    const session = await authClient.getSession();
    return session?.data?.session?.token ?? null;
  } catch {
    return null;
  }
}
