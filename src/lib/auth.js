// Password-only login resolution (Server-Side Access Control, Req 1, 2, 13.3).
//
// The user types only a password. We resolve exactly one session/role by
// trying each predefined account email in a FIXED order (owner first, then
// employee), stopping on the first success (Req 1.6). The account emails are
// public identifiers (non-secret) supplied via VITE_ env vars; the password is
// validated server-side by Supabase against a hashed credential and is never
// trimmed, normalized, logged, or persisted here (Req 1.7, 9.6, 11).
//
// `signInResolvingRole` returns exactly one of:
//   { ok: true,  role, session }
//   { ok: false, code: 'empty'       }   // Req 1.8 / 2.2  (no network call made)
//   { ok: false, code: 'invalid'     }   // Req 1.9 / 2.1  (no email matched)
//   { ok: false, code: 'ratelimited' }   // Req 2.6 / 13.3
//   { ok: false, code: 'timeout'     }   // Req 1.10 / 2.7 (>10s or unreachable)

import { supabase, LOGIN_EMAILS } from './supabase.js';

// Sentinel used to detect which arm of the Promise.race won.
const TIMEOUT = Symbol('timeout');

/**
 * Is the raw password empty or whitespace-only?
 *
 * IMPORTANT: this only decides whether to SKIP the network call. The value
 * actually forwarded to the auth service is the raw, untrimmed string (Req 1.7).
 */
function isBlank(password) {
  return (
    typeof password !== 'string' ||
    password.length === 0 ||
    password.trim().length === 0
  );
}

/**
 * Classify a sign-in error into a failure code.
 * Rate-limit (HTTP 429 / rate-limit message) is distinguished so we can stop
 * immediately (Req 2.6, 13.3). Everything else during the loop is treated as an
 * invalid credential so we can try the next email.
 */
function classifyError(error) {
  if (!error) return null;
  const status = error.status ?? error.statusCode ?? error.code;
  const message = String(error.message ?? '').toLowerCase();
  if (status === 429 || /rate.?limit|too many/.test(message)) {
    return 'ratelimited';
  }
  return 'invalid';
}

/** Default role fetch — deferred import so this module loads even before
 * `content.js` exists (it is built in parallel). Tests inject their own. */
async function defaultGetRole(userId) {
  const mod = await import('./content.js');
  return mod.getRole(userId);
}

/** Default sign-in via the shared Supabase client. */
async function defaultSignIn({ email, password }) {
  return supabase.auth.signInWithPassword({ email, password });
}

export const defaults = {
  get emails() {
    return LOGIN_EMAILS;
  },
  signIn: defaultSignIn,
  getRole: defaultGetRole,
  timeoutMs: 10000,
};

/**
 * Resolve exactly one session/role from a typed password.
 *
 * @param {string} password  Raw password as typed (never trimmed before sending).
 * @param {object} deps      Injectable dependencies for offline testing:
 *   - emails    {string[]}                       predefined account emails, in order
 *   - signIn    async ({email,password}) => {data,error}
 *   - getRole   async (userId) => 'owner'|'employee'|null
 *   - timeoutMs {number}                          per-attempt timeout (default 10000)
 */
export async function signInResolvingRole(password, deps = defaults) {
  // Req 1.8 / 2.2 — reject empty/whitespace-only WITHOUT any network call.
  if (isBlank(password)) {
    return { ok: false, code: 'empty' };
  }

  const emails = deps.emails ?? [];
  const timeoutMs = deps.timeoutMs ?? 10000;

  for (const email of emails) {
    let timer;
    let result;
    try {
      const timeoutPromise = new Promise((resolve) => {
        timer = setTimeout(() => resolve(TIMEOUT), timeoutMs);
      });
      // Forward the raw password byte-for-byte (Req 1.7).
      result = await Promise.race([
        deps.signIn({ email, password }),
        timeoutPromise,
      ]);
    } catch (err) {
      // A thrown error is a network/transport failure unless it is a rate limit.
      if (classifyError(err) === 'ratelimited') {
        return { ok: false, code: 'ratelimited' };
      }
      return { ok: false, code: 'timeout' }; // Req 1.10 / 2.7
    } finally {
      clearTimeout(timer);
    }

    // The attempt exceeded the timeout window (Req 1.10 / 2.7).
    if (result === TIMEOUT) {
      return { ok: false, code: 'timeout' };
    }

    const { data, error } = result ?? {};

    // First success wins — resolve its role and stop (Req 1.6).
    const user = data?.user ?? data?.session?.user ?? null;
    const session = data?.session ?? null;
    if (!error && session && user) {
      const role = await deps.getRole(user.id);
      return { ok: true, role, session };
    }

    // Rate limiting stops the whole flow immediately (Req 2.6 / 13.3).
    if (classifyError(error) === 'ratelimited') {
      return { ok: false, code: 'ratelimited' };
    }
    // Otherwise (invalid credential) — try the next email in order.
  }

  // No predefined email matched (Req 1.9 / 2.1).
  return { ok: false, code: 'invalid' };
}
