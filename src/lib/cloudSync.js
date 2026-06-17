import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase, isCloudEnabled } from './supabase.js';

/**
 * Cross-device synced state.
 *
 * Same API as the old useLocalStorage: const [value, setValue] = useCloudState(key, initial).
 *
 * Behavior:
 *  - Reads localStorage instantly (no flash), so the UI is fast.
 *  - If cloud is enabled AND we are signed in, it fetches the latest value from
 *    Supabase on mount and subscribes to realtime changes (so PC ↔ phone stay in sync).
 *  - On every change, it writes to localStorage (cache) and upserts to Supabase (debounced).
 *  - If cloud is off or the network fails, it silently behaves like localStorage. Nothing breaks.
 */

const LS_PREFIX = 'r2up_v1::';
const TABLE = 'user_state';

function lsGet(key, fallback) {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}
function lsSet(key, value) {
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(value));
  } catch {}
}

// Track auth readiness once, app-wide.
let authReady = false;
let authUserId = null;
const authListeners = new Set();

export function setAuthState(userId) {
  authReady = true;
  authUserId = userId || null;
  authListeners.forEach((fn) => fn(authUserId));
}
export function getAuthUserId() {
  return authUserId;
}

export function useCloudState(key, initial) {
  const [value, setValue] = useState(() => lsGet(key, initial));
  const [uid, setUid] = useState(authUserId);
  const debounceRef = useRef(null);
  const mountedRef = useRef(true);

  // Subscribe to auth changes (so we fetch once signed in).
  useEffect(() => {
    mountedRef.current = true;
    const fn = (id) => setUid(id);
    authListeners.add(fn);
    if (authReady) setUid(authUserId);
    return () => {
      mountedRef.current = false;
      authListeners.delete(fn);
    };
  }, []);

  // Fetch from cloud when signed in, and subscribe to realtime updates.
  useEffect(() => {
    if (!isCloudEnabled || !supabase || !uid) return;

    let channel;
    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('value')
        .eq('user_id', uid)
        .eq('key', key)
        .maybeSingle();
      if (cancelled || !mountedRef.current) return;
      if (!error && data && data.value !== undefined && data.value !== null) {
        setValue(data.value);
        lsSet(key, data.value);
      } else if (!error && !data) {
        // No cloud row yet — push our current local value up so it's seeded.
        const current = lsGet(key, initial);
        supabase.from(TABLE).upsert({ user_id: uid, key, value: current }).then(() => {});
      }

      // Realtime: reflect changes made on other devices live.
      channel = supabase
        .channel(`user_state:${uid}:${key}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: TABLE, filter: `user_id=eq.${uid}` },
          (payload) => {
            const row = payload.new;
            if (row && row.key === key && mountedRef.current) {
              setValue(row.value);
              lsSet(key, row.value);
            }
          }
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel && supabase) supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, key]);

  const update = useCallback(
    (next) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? next(prev) : next;
        lsSet(key, resolved);
        // Debounced cloud write
        if (isCloudEnabled && supabase && authUserId) {
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => {
            supabase
              .from(TABLE)
              .upsert({ user_id: authUserId, key, value: resolved })
              .then(() => {});
          }, 600);
        }
        return resolved;
      });
    },
    [key]
  );

  return [value, update];
}
