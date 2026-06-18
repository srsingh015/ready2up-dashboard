// Auto-update: makes sure nobody is ever stuck on an old cached design.
//
// At build time, vite injects __BUILD_ID__ (a unique number) into this bundle
// and also writes /version.json with the same id. On load (and whenever the tab
// is re-focused) we fetch version.json fresh from the network. If the server's
// build id is newer than the one baked into this page, we force a reload to
// pull the latest version — no manual hard-refresh, no "clear cache" needed.

const LOCAL_BUILD = typeof __BUILD_ID__ !== 'undefined' ? __BUILD_ID__ : '';
const RELOAD_GUARD = 'r2up_reloaded_for_update';

let checking = false;

export async function checkForUpdate() {
  if (!LOCAL_BUILD || checking) return;
  checking = true;
  try {
    const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    const remote = data && data.build ? String(data.build) : '';
    if (!remote) return;

    if (remote !== LOCAL_BUILD) {
      // Guard against reload loops: only auto-reload once per session.
      if (!sessionStorage.getItem(RELOAD_GUARD)) {
        sessionStorage.setItem(RELOAD_GUARD, '1');
        window.location.reload();
      }
    } else {
      // We're on the latest — clear the guard so future updates can reload again.
      sessionStorage.removeItem(RELOAD_GUARD);
    }
  } catch {
    /* offline or no version.json (e.g. local dev) — ignore */
  } finally {
    checking = false;
  }
}

// Start checking: on load, and every time the tab becomes visible again.
export function startUpdateWatcher() {
  checkForUpdate();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkForUpdate();
  });
}
