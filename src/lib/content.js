// Content data-access layer.
//
// This module is the client-side bridge between the Supabase-backed content
// store and the existing section components. Authorization is enforced entirely
// server-side by Row Level Security (RLS): the browser sends a plain `select`
// carrying its session JWT and the database returns ONLY the rows the caller's
// role is permitted to read. Nothing here grants or widens access — it merely
// reads what arrived and reshapes it for the UI.
//
// Exports:
//   - getRole(userId, deps)          — resolve the caller's role from profiles
//   - fetchContent(deps)             — fetch permitted content rows (non-destructive)
//   - rowsToContentObject(rows)      — PURE: rows -> { key: data }
//   - navIdsFromContent(contentObj)  — PURE: which nav entries have their data

import { supabase } from './supabase.js';
import { NAV_CONTENT } from '../config/navContent.js';

// Content retrieval must not hang the UI. If the store does not answer within
// this window we treat it as unreachable and return a non-destructive failure
// so the caller can retain any previously rendered content (Req 4.5).
export const CONTENT_TIMEOUT_MS = 10000;

/**
 * Resolve the caller's role from their profile row (Req 3.3, 3.4).
 *
 * Returns `'owner'` or `'employee'` ONLY when the stored role attribute is
 * exactly that string. A missing profile, a null role, or any other value
 * resolves to `null` — the least-privileged / denied outcome. The client never
 * infers a role from anything but this server-stored value.
 *
 * @param {string} userId - the authenticated user's id.
 * @param {{ query?: (userId: string) => Promise<{ data?: any, error?: any }> }} [deps]
 *   Injectable dependency for tests. `query` defaults to a Supabase select on
 *   `profiles` returning `{ data, error }` (as `maybeSingle()` does).
 * @returns {Promise<'owner' | 'employee' | null>}
 */
export async function getRole(userId, deps = {}) {
  const query =
    deps.query ||
    ((id) => supabase.from('profiles').select('role').eq('id', id).maybeSingle());

  let result;
  try {
    result = await query(userId);
  } catch {
    // Any failure to read the role is treated as "no role" (denied).
    return null;
  }

  if (!result || result.error) return null;

  const role = result.data ? result.data.role : undefined;
  if (role === 'owner') return 'owner';
  if (role === 'employee') return 'employee';
  return null;
}

/**
 * Fetch every content row the caller's session is permitted to read (Req 4.2, 5).
 *
 * RLS performs all filtering server-side; the client only ever selects
 * `key, data` — the `min_role` classification never leaves the database. The
 * call is wrapped in a timeout so a slow/unreachable store cannot hang the UI.
 *
 * On success:  `{ ok: true, rows }`
 * On timeout:  `{ ok: false, code: 'timeout' }`   (Req 4.5)
 * On error:    `{ ok: false, code: 'error' }`      (Req 4.6)
 *
 * Both failure results are NON-DESTRUCTIVE: the caller retains the active
 * session and any previously rendered content (there is no bundled/encrypted
 * fallback — Req 15.4).
 *
 * @param {{ query?: () => Promise<{ data?: any, error?: any }>, timeoutMs?: number }} [deps]
 *   Injectable dependency for tests.
 * @returns {Promise<{ ok: true, rows: any[] } | { ok: false, code: 'timeout' | 'error' }>}
 */
export async function fetchContent(deps = {}) {
  const timeoutMs = typeof deps.timeoutMs === 'number' ? deps.timeoutMs : CONTENT_TIMEOUT_MS;
  const query =
    deps.query || (() => supabase.from('content_sections').select('key, data'));

  const TIMEOUT = Symbol('content-timeout');
  let timeoutHandle;
  const timeoutPromise = new Promise((resolve) => {
    timeoutHandle = setTimeout(() => resolve(TIMEOUT), timeoutMs);
  });

  try {
    const result = await Promise.race([Promise.resolve().then(query), timeoutPromise]);

    if (result === TIMEOUT) {
      return { ok: false, code: 'timeout' };
    }
    if (!result || result.error) {
      return { ok: false, code: 'error' };
    }
    return { ok: true, rows: Array.isArray(result.data) ? result.data : [] };
  } catch {
    return { ok: false, code: 'error' };
  } finally {
    clearTimeout(timeoutHandle);
  }
}

/**
 * PURE: reconstruct the `{ key: data }` object the existing section components
 * consume from the rows returned by the store (Req 4.2, 5.3, 6.2, 15.3).
 *
 * - First row wins per key (deterministic; the DB returns at most one row per
 *   key per role, but this keeps the function total and stable regardless).
 * - Malformed rows (null, or without a string `key`) are ignored.
 * - Total over `null` / `undefined` / empty input — returns `{}`.
 * - Never invents, drops, or corrupts a key.
 *
 * @param {Array<{ key?: unknown, data?: unknown }> | null | undefined} rows
 * @returns {Record<string, unknown>}
 */
export function rowsToContentObject(rows) {
  const out = {};
  if (!Array.isArray(rows)) return out;
  for (const row of rows) {
    if (row && typeof row.key === 'string' && !(row.key in out)) {
      out[row.key] = row.data;
    }
  }
  return out;
}

/**
 * PURE: which navigation entries to present, derived purely from the data that
 * arrived (Req 6.1, 6.3, 8.2).
 *
 * A nav entry is included iff ALL of its backing content keys (from
 * NAV_CONTENT) are present in `contentObj`. This makes the navigation a
 * reflection of server-enforced authorization rather than any client tier
 * table — a nav entry can only appear when its content was actually returned.
 *
 * @param {Record<string, unknown> | null | undefined} contentObj
 * @returns {string[]} the nav ids whose backing keys are all present.
 */
export function navIdsFromContent(contentObj) {
  const obj = contentObj && typeof contentObj === 'object' ? contentObj : {};
  const ids = [];
  for (const navId of Object.keys(NAV_CONTENT)) {
    const backingKeys = NAV_CONTENT[navId];
    const allPresent = backingKeys.every((key) =>
      Object.prototype.hasOwnProperty.call(obj, key)
    );
    if (allPresent) ids.push(navId);
  }
  return ids;
}
