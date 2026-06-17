import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { payload } from './data/__payload.js';
import { decryptPayload } from './crypto/decrypt.js';
import PasswordGate from './components/PasswordGate.jsx';
import Layout from './components/Layout.jsx';
import WelcomeIntro from './components/WelcomeIntro.jsx';
import CherryPetals from './components/ui/CherryPetals.jsx';
import { useTheme } from './hooks/useTheme.js';
import { supabase, isCloudEnabled } from './lib/supabase.js';
import { setAuthState } from './lib/cloudSync.js';

const SUPABASE_LOGIN_EMAIL = import.meta.env.VITE_SUPABASE_LOGIN_EMAIL || '';

export default function App() {
  const [unlocked, setUnlocked] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const { theme, toggleTheme } = useTheme();

  // Restore an existing Supabase session on load (so sync works after refresh).
  useEffect(() => {
    if (!isCloudEnabled || !supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState(session?.user?.id || null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthState(session?.user?.id || null);
    });
    return () => sub?.subscription?.unsubscribe?.();
  }, []);

  // Try a silent unlock if the same browser tab still has the session token.
  useEffect(() => {
    const token = sessionStorage.getItem('r2up_session_pw');
    if (token) handleUnlock(token, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sign into Supabase using the SAME password that decrypts the content.
  // Best-effort: if it fails (no account yet / offline), the dashboard still
  // works, just without cross-device sync. Never blocks the user.
  async function signIntoCloud(password) {
    if (!isCloudEnabled || !supabase || !SUPABASE_LOGIN_EMAIL) return;
    try {
      const { data: s } = await supabase.auth.getSession();
      if (s?.session?.user?.id) {
        setAuthState(s.session.user.id);
        return;
      }
      const { data: res, error: err } = await supabase.auth.signInWithPassword({
        email: SUPABASE_LOGIN_EMAIL,
        password,
      });
      if (!err && res?.user?.id) setAuthState(res.user.id);
    } catch {
      /* sync stays off; dashboard still works */
    }
  }

  async function handleUnlock(password, silent = false) {
    if (!password) return;
    setBusy(true);
    setError('');
    try {
      const decrypted = await decryptPayload(payload, password);
      setData(decrypted);
      setUnlocked(true);
      sessionStorage.setItem('r2up_session_pw', password);
      // Kick off cloud sign-in with the same password (non-blocking).
      signIntoCloud(password);
      if (!silent) setShowWelcome(true);
    } catch (err) {
      if (!silent) setError('Incorrect password.');
      sessionStorage.removeItem('r2up_session_pw');
    } finally {
      setBusy(false);
    }
  }

  function lock() {
    setUnlocked(false);
    setData(null);
    setShowWelcome(false);
    sessionStorage.removeItem('r2up_session_pw');
    if (isCloudEnabled && supabase) supabase.auth.signOut().catch(() => {});
  }

  // ────────── 1) Public login screen — no personal info shown ──────────
  if (!unlocked) {
    return (
      <>
        <CherryPetals active={theme === 'blossom'} />
        <PasswordGate
          onSubmit={handleUnlock}
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
      <Layout data={data} onLock={lock} theme={theme} toggleTheme={toggleTheme} />
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
