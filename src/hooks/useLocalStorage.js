import { useEffect, useState } from 'react';

// Tiny typed-friendly localStorage hook with namespaced key + JSON safety.
const NS = 'r2up_v1::';

export function useLocalStorage(key, initial) {
  const fullKey = NS + key;
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(fullKey);
      if (raw === null) return initial;
      return JSON.parse(raw);
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(fullKey, JSON.stringify(value));
    } catch {
      // swallow quota / serialization errors
    }
  }, [fullKey, value]);

  return [value, setValue];
}
