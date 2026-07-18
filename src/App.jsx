import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import PasswordGate from './components/PasswordGate.jsx';
import Layout from './components/Layout.jsx';
import WelcomeIntro from './components/WelcomeIntro.jsx';
import CherryPetals from './components/ui/CherryPetals.jsx';
import { useTheme } from './hooks/useTheme.js';
import { supabase, isCloudEnabled } from './lib/supabase.js';
import { signInResolvingRole } from './lib/auth.js';
import { getRole, fetchContent, rowsToContentObject } from './lib/content.js';
import { setAuthState } from './lib/cloudSync.js';
import { startUpdateWatcher } from './lib/version.js';

// Server-side access control (see spec `server-side-access-control`).
//
// Authentication and authorization are now enforced ENTIRELY server-side by
// Supabase Auth + Row-Level Security. The browser types only a password; the
// account email(s) come from non-secret env vars; Supabase validates the
// password against a hashed credential and returns a session. Content is then
// fetched from `content_sections` — RLS returns ONLY the rows the session's
// role is permitted to read, so restricted content never reaches this device.
//
// No Login_Password is EVER persisted on the device (Req 9.6). Session
// persistence is Supabase's job (persistSession/autoRefreshToken under the
// `r2up_auth` storage key). There is no remembered-password storage anymore.

export default function App() {
  const [unlocked, setUnlocked] = useState(false);
  const [data, setData] = useState(null);
  const [role, setRole] = useState(null);
  // Error is a CODE string ('' | 'empty' | 'invalid' | 'ratelimited' |
  // 'timeout' | 'unavailable') that PasswordGate maps to a message.
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const { theme, toggleTheme } = useTheme();

  // Auto-refresh if a newer version is deployed (kills stale-cache problems).
  useEffect(() => {
    startUpdateWatcher();
  }, []);

  // ────────── Bootstrap: restore an existing Supabase session ──────────
  // On load, if a valid persisted session exists we resolve its role, fetch the
  // permitted content, and render the dashboard WITHOUT the login screen
  // (Req 9.2). We also subscribe to auth changes: a SIGNED_OUT / null session
  // (expired session or failed refresh) returns the app to the login screen and
  // withholds content (Req 9.4); a token refresh keeps the session.
  useEffect(() => {
    // Cloud off (no env vars) → no server auth possible. Show the login screen;
    // never crash.
    if (!isCloudEnabled || !supabase) return;

    let active = true;

    async function grantFromSession(session) {
      const userId = session?.user?.id;
      if (!userId) return;
      const resolvedRole = await getRole(userId);
      const res = await fetchContent();
      if (!active) return;
      setAuthState(userId);
      setRole(resolvedRole);
      if (res.ok) {
        setData(rowsToContentObject(res.rows));
        setError('');
      } else {
        // Content store unreachable/errored: still restore the session, but
        // signal that content is temporarily unavailable (Req 4.5/4.6).
        setData(null);
        setError('unavailable');
      }
      setUnlocked(true);
    }

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!active) return;
        if (session?.user?.id) {
          grantFromSession(session);
        } else {
          setAuthState(null);
        }
      })
      .catch(() => {
        if (active) setAuthState(null);
      });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        // Expired session / failed refresh / explicit sign-out → logged out.
        setAuthState(null);
        setUnlocked(false);
        setData(null);
        setRole(null);
        setShowWelcome(false);
      } else {
        // SIGNED_IN / TOKEN_REFRESHED / USER_UPDATED — keep tracker sync bound
        // to the current user. Content grant is handled by login/bootstrap.
        setAuthState(session.user?.id || null);
      }
    });

    return () => {
      active = false;
      sub?.subscription?.unsubscribe?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ────────── Password-only login ──────────
  // Resolve exactly one session/role from the typed password (Req 1), then
  // fetch the role-permitted content and render. On failure, surface the error
  // code to the gate. No password is persisted anywhere (Req 9.6).
  async function handleLogin(password) {
    setBusy(true);
    setError('');
    try {
      const result = await signInResolvingRole(password);
      if (!result.ok) {
        // Codes: 'empty' | 'invalid' | 'ratelimited' | 'timeout' (Req 1.9, 2.x).
        setError(result.code || 'invalid');
        return;
      }

      const { role: resolvedRole, session } = result;
      const res = await fetchContent();
      setRole(resolvedRole);
      if (res.ok) {
        setData(rowsToContentObject(res.rows));
        setError('');
      } else {
        // Authenticated, but content is temporarily unavailable — unlock so the
        // session is retained; don't crash (Req 4.5/4.6).
        setData(null);
        setError('unavailable');
      }
      setUnlocked(true);
      setAuthState(session?.user?.id || null);
      // Personal welcome overlay is owner-only (Req 6.4, 8.5).
      if (resolvedRole === 'owner') setShowWelcome(true);
    } finally {
      setBusy(false);
    }
  }

  // ────────── Logout ──────────
  // End the Supabase session and always return to the login screen — even if
  // signOut() throws, the local state is forced logged-out (Req 10.3, 10.4).
  async function logout() {
    try {
      if (isCloudEnabled && supabase) await supabase.auth.signOut();
    } catch {
      /* Ignore — we still force the local logged-out state below (Req 10.4). */
    } finally {
      setUnlocked(false);
      setData(null);
      setRole(null);
      setShowWelcome(false);
      setError('');
      setAuthState(null);
    }
  }

  // ────────── 1) Public login screen — no personal info shown ──────────
  if (!unlocked) {
    return (
      <>
        <CherryPetals active={theme === 'blossom'} />
        <PasswordGate
          onSubmit={handleLogin}
          error={error}
          busy={busy}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      </>
    );
  }

  // ────────── 2) Authenticated: dashboard + (optional) welcome overlay ──────────
  return (
    <>
      <CherryPetals active={theme === 'blossom'} />
      <Layout data={data} role={role} onLock={logout} theme={theme} toggleTheme={toggleTheme} />
      <AnimatePresence>
        {showWelcome && (
          <WelcomeIntro
            key="welcome"
            theme={theme}
            durationMs={5500}
            onDone={() => setShowWelcome(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
