import { useState, useRef, useEffect } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, Loader2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import ThemeToggle from './ui/ThemeToggle.jsx';

/**
 * Public-facing login screen.
 *
 * IMPORTANT: This screen has NO personal text on it. Anyone could see this URL,
 * so it shows nothing private — just a generic password prompt and the brand.
 * The personal welcome ("Hello, Kaira Baby") only appears AFTER a correct password.
 */
export default function PasswordGate({ onSubmit, error, busy, theme, toggleTheme }) {
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const inputRef = useRef(null);
  const [shake, setShake] = useState(0);
  const isBlossom = theme === 'blossom';

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (error) setShake((s) => s + 1);
  }, [error]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!busy) onSubmit(password);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 sm:py-10 relative overflow-hidden">
      {/* Theme toggle, top-right */}
      {toggleTheme && (
        <div className="absolute top-4 right-4 sm:top-5 sm:right-5 z-30">
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} layout="compact" />
        </div>
      )}

      {/* Ambient orbs — themed */}
      <div className="pointer-events-none absolute -top-32 -right-32 sm:-top-40 sm:-right-40 w-[420px] h-[420px] sm:w-[600px] sm:h-[600px] rounded-full opacity-30 blur-3xl"
        style={{ background: isBlossom
          ? 'radial-gradient(circle, rgba(236,72,153,0.45), transparent 70%)'
          : 'radial-gradient(circle, rgba(245,158,11,0.4), transparent 70%)' }} />
      <div className="pointer-events-none absolute -bottom-32 -left-32 sm:-bottom-40 sm:-left-40 w-[380px] h-[380px] sm:w-[500px] sm:h-[500px] rounded-full opacity-25 blur-3xl"
        style={{ background: isBlossom
          ? 'radial-gradient(circle, rgba(245,158,11,0.35), transparent 70%)'
          : 'radial-gradient(circle, rgba(139,92,246,0.4), transparent 70%)' }} />
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-[0.3]" />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative w-full max-w-md z-10"
      >
        <div className="glass rounded-3xl p-6 sm:p-8 shadow-glow">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-glow"
              style={{ background: isBlossom
                ? 'linear-gradient(135deg, #ec4899, #f472b6)'
                : 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}>
              <Lock className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <div className="text-[10px] sm:text-xs tracking-widest uppercase font-bold" style={{ color: isBlossom ? '#be185d' : '#fbbf24' }}>Private</div>
              <div className="font-display text-lg sm:text-xl font-extrabold gold-text leading-tight">Ready2UP</div>
            </div>
          </div>

          <h1 className="font-display text-xl sm:text-2xl font-extrabold leading-tight mb-2">
            Enter password to continue.
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed">
            End-to-end encrypted. Without the password, nothing inside can be read — by anyone.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4" autoComplete="off">
            <motion.div
              key={shake}
              animate={shake ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : {}}
              transition={{ duration: 0.4 }}
              className="relative"
            >
              <input
                ref={inputRef}
                type={show ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={busy}
                placeholder="Password"
                autoComplete="off"
                spellCheck={false}
                inputMode="text"
                className="w-full bg-ink-900 border border-white/10 hover:border-white/20 focus:border-amber-500/60 transition-colors rounded-xl px-4 py-3 sm:py-3.5 pr-12 text-base placeholder-slate-500 focus-ring disabled:opacity-60"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShow((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
                aria-label={show ? 'Hide password' : 'Show password'}
              >
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </motion.div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-rose-400 font-medium"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={busy || !password}
              className="w-full inline-flex items-center justify-center gap-2 disabled:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 font-bold text-sm tracking-wide py-3 sm:py-3.5 rounded-xl transition-all focus-ring active:scale-[0.99]"
              style={{
                background: busy || !password
                  ? undefined
                  : isBlossom
                    ? 'linear-gradient(135deg, #ec4899, #f472b6)'
                    : 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                color: '#fff',
                boxShadow: busy || !password
                  ? undefined
                  : isBlossom
                    ? '0 8px 24px -8px rgba(236,72,153,0.5)'
                    : '0 8px 24px -8px rgba(245,158,11,0.5)',
              }}
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              {busy ? 'Decrypting…' : 'Unlock'}
            </button>
          </form>

          <div className="mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-white/[0.06] text-[10px] sm:text-[11px] leading-relaxed text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" style={{ color: isBlossom ? '#ec4899' : '#fbbf24' }} />
            <span>
              <span className="font-semibold" style={{ color: isBlossom ? '#be185d' : 'rgba(251,191,36,0.85)' }}>AES-256-GCM</span> · 600,000-iteration PBKDF2 · session-only · zero analytics
            </span>
          </div>
        </div>

        <div className="mt-4 text-center text-[10px] sm:text-[11px] text-slate-600">
          Press <span className="font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/[0.06]">Enter</span> to unlock
        </div>
      </motion.div>
    </div>
  );
}
