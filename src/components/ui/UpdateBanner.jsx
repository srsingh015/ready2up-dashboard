import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { onUpdatePending } from '../../lib/version.js';

/**
 * Last-resort update prompt.
 *
 * The watcher in lib/version.js handles new deploys silently in almost every
 * case. This banner only appears in the one situation it cannot fix on its own:
 * a newer build exists, we already force-reloaded once for it, and the browser
 * STILL handed back the old page. Rather than loop or leave the user staring at
 * stale content, we surface it and let them trigger the reload.
 *
 * Tapping it drops every cache we can reach and reloads on a fresh url.
 */
export default function UpdateBanner() {
  const [pending, setPending] = useState(false);

  useEffect(() => onUpdatePending(() => setPending(true)), []);

  if (!pending) return null;

  async function reloadNow() {
    try {
      if (typeof caches !== 'undefined') {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch {
      /* ignore — the url change below is the real mechanism */
    }
    const { pathname, hash } = window.location;
    window.location.replace(`${pathname}?v=${Date.now()}${hash}`);
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] w-[min(92vw,26rem)]">
      <div className="flex items-center gap-3 rounded-2xl border border-amber-500/40 bg-ink-900/95 px-4 py-3 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.7)] backdrop-blur">
        <RefreshCw className="h-4 w-4 shrink-0 text-amber-300" />
        <p className="min-w-0 flex-1 text-sm text-slate-300">
          A newer version is available.
        </p>
        <button
          onClick={reloadNow}
          className="shrink-0 rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-bold text-ink-950 transition-colors hover:bg-amber-300"
        >
          Reload
        </button>
      </div>
    </div>
  );
}
