// Auto-update: makes sure nobody is ever stuck on an old cached build.
//
// At build time vite injects __BUILD_ID__ into this bundle and writes
// /version.json carrying the same id. We poll version.json and compare. If the
// server is on a newer build than this page, we get the user onto it.
//
// WHY THE PREVIOUS VERSION GOT STUCK
// It guarded against reload loops with a single boolean flag: set the flag,
// then call window.location.reload(). Two problems compounded:
//   1. window.location.reload() re-requests the SAME url, so a browser holding
//      a cached copy of index.html could serve that cache straight back. The
//      page came up on the identical stale build.
//   2. Because the boolean flag was already set, every later check refused to
//      act. One useless reload and the tab was pinned to the old build for the
//      rest of the session — exactly the "phone keeps showing old data" symptom.
//
// THE FIX
//   - The reload attempt is recorded PER REMOTE BUILD ID, not as a boolean, so
//     a newer deploy can always trigger a fresh attempt.
//   - The reload navigates to a cache-busting url the browser has no entry for,
//     which forces a real network fetch instead of a cache hit.
//   - If we already tried for this build id and are somehow STILL stale, we stop
//     reloading and notify the UI so it can show a manual "reload" prompt. The
//     user is never silently stranded and we never loop.

const LOCAL_BUILD = typeof __BUILD_ID__ !== 'undefined' ? String(__BUILD_ID__) : '';

// sessionStorage key prefix recording "we already force-reloaded for build X".
const ATTEMPT_PREFIX = 'r2up_update_attempt::';

// How often to poll while the tab stays open.
const POLL_MS = 90_000;

let checking = false;
let timer = null;
const listeners = new Set();

/**
 * PURE decision logic — what to do given the two build ids and whether we have
 * already force-reloaded for this remote build.
 *
 * @param {{ local: string, remote: string, attempted: boolean }} input
 * @returns {'none' | 'reload' | 'notify'}
 *   'none'   — up to date, or not enough information to act
 *   'reload' — server is ahead and we have not yet tried; force a fresh load
 *   'notify' — server is ahead but our reload did not take; ask the user
 */
export function decideUpdateAction({ local, remote, attempted }) {
  if (!local || !remote) return 'none';
  if (local === remote) return 'none';
  return attempted ? 'notify' : 'reload';
}

/** Safe sessionStorage access — private mode / disabled storage must not throw. */
function readAttempt(remote) {
  try {
    return sessionStorage.getItem(ATTEMPT_PREFIX + remote) === '1';
  } catch {
    return false;
  }
}

function writeAttempt(remote) {
  try {
    sessionStorage.setItem(ATTEMPT_PREFIX + remote, '1');
  } catch {
    /* storage unavailable — we simply lose loop protection, not correctness */
  }
}

/**
 * Navigate in a way the HTTP cache cannot satisfy from a stored copy.
 *
 * A plain reload() re-requests the current url and may be answered from cache.
 * Navigating to the same path with a changed query string is a different cache
 * key, so the browser has to go to the network. `replace` keeps it out of the
 * back-history so the user cannot navigate back into the stale copy.
 */
function forceFreshLoad(remote) {
  const { pathname, hash, search } = window.location;
  const params = new URLSearchParams(search);
  params.set('v', remote);
  window.location.replace(`${pathname}?${params.toString()}${hash}`);
}

/** Notify subscribers that an update is waiting and auto-reload did not work. */
function emitUpdatePending() {
  for (const fn of listeners) {
    try {
      fn();
    } catch {
      /* a broken listener must not break the watcher */
    }
  }
}

/**
 * Subscribe to "an update is available but needs a manual reload".
 * Returns an unsubscribe function.
 */
export function onUpdatePending(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Discard any cached responses a service worker or the Cache API is holding. */
async function clearCacheStorage() {
  try {
    if (typeof caches === 'undefined') return;
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
  } catch {
    /* not supported / not permitted — ignore */
  }
}

/**
 * Fetch the deployed build id and act on it. Safe to call often — overlapping
 * calls are coalesced and any network failure is ignored (offline, or local dev
 * where /version.json does not exist).
 */
export async function checkForUpdate() {
  if (!LOCAL_BUILD || checking) return;
  checking = true;
  try {
    // Cache-busting param AND no-store: some mobile browsers and intermediate
    // proxies honour one but not the other.
    const res = await fetch(`/version.json?t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
    });
    if (!res.ok) return;

    const data = await res.json();
    const remote = data && data.build ? String(data.build) : '';
    if (!remote) return;

    const action = decideUpdateAction({
      local: LOCAL_BUILD,
      remote,
      attempted: readAttempt(remote),
    });

    if (action === 'reload') {
      writeAttempt(remote);
      await clearCacheStorage();
      forceFreshLoad(remote);
      return;
    }

    if (action === 'notify') {
      emitUpdatePending();
    }
  } catch {
    /* offline, or no version.json (local dev) — nothing to do */
  } finally {
    checking = false;
  }
}

/**
 * Start watching for new deploys: immediately, whenever the tab is re-focused
 * or becomes visible again, and on a timer so a tab left open still updates.
 */
export function startUpdateWatcher() {
  checkForUpdate();

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkForUpdate();
  });
  window.addEventListener('focus', checkForUpdate);
  window.addEventListener('online', checkForUpdate);

  if (timer) clearInterval(timer);
  timer = setInterval(checkForUpdate, POLL_MS);
}
