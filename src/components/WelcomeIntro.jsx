import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

/**
 * Full-screen welcome overlay shown ONLY after a successful password entry.
 *
 * Hard-locked to ~5.5 seconds — no key, no click, no tap can dismiss it early.
 * The user said: "for at least 5 seconds it should stay" — so we ignore all input.
 *
 * Renders OVER the dashboard (which is already mounted underneath), then fades
 * cleanly so the dashboard is revealed without any layout flash.
 */
export default function WelcomeIntro({ theme = 'midnight', durationMs = 5500, onDone }) {
  const isBlossom = theme === 'blossom';

  // Auto-dismiss after the configured duration. We DELIBERATELY do not bind
  // any keyboard / pointer listeners — the moment is meant to be experienced.
  useEffect(() => {
    const t = setTimeout(() => onDone?.(), durationMs);
    return () => clearTimeout(t);
  }, [durationMs, onDone]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      // Pointer-events: none means clicks fall through but visual is full-screen.
      // This guarantees no accidental dismissal possible.
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 select-none"
      style={{
        background: isBlossom
          ? 'linear-gradient(135deg, #ffe4ef 0%, #fef0eb 50%, #fff7f0 100%)'
          : 'linear-gradient(135deg, #1a1232 0%, #0f1528 50%, #131320 100%)',
        pointerEvents: 'auto',
      }}
      aria-live="polite"
    >
      {/* Soft halo pulse behind the title */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[160px] sm:w-[600px] sm:h-[280px] rounded-full blur-3xl pointer-events-none"
        style={{
          background: isBlossom
            ? 'radial-gradient(ellipse, rgba(236,72,153,0.35), transparent 70%)'
            : 'radial-gradient(ellipse, rgba(245,158,11,0.25), transparent 70%)',
          animation: 'haloPulse 4s ease-in-out infinite',
        }}
      />
      <div
        className="absolute -top-24 -right-24 w-[420px] h-[420px] sm:w-[600px] sm:h-[600px] rounded-full opacity-40 blur-3xl pointer-events-none"
        style={{
          background: isBlossom
            ? 'radial-gradient(circle, rgba(236,72,153,0.5), transparent 70%)'
            : 'radial-gradient(circle, rgba(245,158,11,0.45), transparent 70%)',
        }}
      />
      <div
        className="absolute -bottom-24 -left-24 w-[380px] h-[380px] sm:w-[500px] sm:h-[500px] rounded-full opacity-35 blur-3xl pointer-events-none"
        style={{
          background: isBlossom
            ? 'radial-gradient(circle, rgba(245,158,11,0.4), transparent 70%)'
            : 'radial-gradient(circle, rgba(139,92,246,0.45), transparent 70%)',
        }}
      />

      {/* Content stack — centered */}
      <div className="relative z-10 text-center w-full max-w-3xl">
        {/* Floating emoji */}
        <motion.div
          initial={{ scale: 0, rotate: -180, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
          className="inline-block mb-5 sm:mb-7"
          style={{ animation: 'floatY 3.5s ease-in-out infinite' }}
        >
          <span className="text-6xl sm:text-7xl md:text-8xl drop-shadow-lg" style={{ display: 'inline-block' }}>
            {isBlossom ? '🌸' : '✨'}
          </span>
        </motion.div>

        {/* Title — gradient text with proper inline-block sizing for reliable rendering */}
        <motion.div
          initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ delay: 0.45, duration: 0.8, ease: 'easeOut' }}
          className="px-2"
        >
          <h1
            className="font-display font-extrabold leading-[1.05] tracking-tight"
            style={{
              fontSize: 'clamp(2.5rem, 9vw, 5.5rem)',
              backgroundImage: isBlossom
                ? 'linear-gradient(110deg, #ec4899 0%, #f472b6 25%, #fbbf24 50%, #f472b6 75%, #ec4899 100%)'
                : 'linear-gradient(110deg, #fde68a 0%, #f59e0b 30%, #fbbf24 50%, #f59e0b 70%, #fde68a 100%)',
              backgroundSize: '250% 100%',
              backgroundRepeat: 'no-repeat',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'transparent',
              animation: 'blossomShimmer 5s ease-in-out infinite',
              padding: '0 0.1em',
              display: 'inline-block',
              lineHeight: 1.1,
            }}
          >
            Hello, Kaira Baby
          </h1>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.6 }}
          className="mt-4 sm:mt-5 text-base sm:text-lg md:text-xl italic font-medium tracking-wide flex items-center justify-center gap-2 sm:gap-3"
          style={{ color: isBlossom ? '#be185d' : '#fbbf24' }}
        >
          <Heart className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
          this is for us.
          <Heart className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
        </motion.p>

        {/* Tiny progress bar so they know it's a real moment, not a stuck screen */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1.6, duration: 0.6 }}
          className="mt-12 sm:mt-16 mx-auto w-32 sm:w-40 h-[3px] rounded-full overflow-hidden"
          style={{ background: isBlossom ? 'rgba(190, 24, 93, 0.15)' : 'rgba(251, 191, 36, 0.15)' }}
        >
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.2, duration: (durationMs - 200) / 1000, ease: 'linear' }}
            className="h-full origin-left"
            style={{
              background: isBlossom
                ? 'linear-gradient(90deg, #ec4899, #f472b6, #fbbf24)'
                : 'linear-gradient(90deg, #fbbf24, #f59e0b, #fde68a)',
            }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
