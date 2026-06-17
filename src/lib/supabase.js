import { createClient } from '@supabase/supabase-js';

// These come from Vite env vars (set in .env locally, and in Vercel for prod).
// Both values are SAFE to expose in the browser — the anon key is designed to
// be public and is protected by Row Level Security in the database.
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// If no keys are configured, the app runs in LOCAL-ONLY mode (localStorage),
// exactly like before — nothing breaks. Cloud sync turns on automatically
// the moment the env vars are present.
export const isCloudEnabled = Boolean(url && anonKey);

export const supabase = isCloudEnabled
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: 'r2up_auth',
      },
    })
  : null;
