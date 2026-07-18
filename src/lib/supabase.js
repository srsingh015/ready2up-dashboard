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

// Account emails for password-only login resolution. The single password entered
// at the gate is tried against these emails in fixed order (owner first, then
// employee) to resolve which account — and therefore which role — is signing in.
// These are NOT secrets: they are configured via Vite env vars and are safe to
// expose in the browser. Authorization is enforced server-side by RLS.
export const OWNER_EMAIL = import.meta.env.VITE_SUPABASE_LOGIN_EMAIL || '';
export const EMPLOYEE_EMAIL = import.meta.env.VITE_SUPABASE_EMPLOYEE_EMAIL || '';

// Fixed evaluation order: owner first, then employee. `.filter(Boolean)` drops
// any unconfigured (empty-string) email so login only attempts real accounts.
export const LOGIN_EMAILS = [OWNER_EMAIL, EMPLOYEE_EMAIL].filter(Boolean);
