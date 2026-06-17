import { motion } from 'framer-motion';

/**
 * Animated pill toggle: Midnight (🌙) ↔ Cherry Blossom (🌸)
 * Two layouts: 'inline' (full pill, used in sidebar) and 'compact' (tiny round, used elsewhere)
 */
export default function ThemeToggle({ theme, toggleTheme, layout = 'inline' }) {
  const isBlossom = theme === 'blossom';

  if (layout === 'compact') {
    return (
      <button
        onClick={toggleTheme}
        aria-label={isBlossom ? 'Switch to Midnight theme' : 'Switch to Cherry Blossom theme'}
        title={isBlossom ? 'Midnight theme' : 'Cherry Blossom theme'}
        className="relative w-9 h-9 rounded-full border transition-all flex items-center justify-center text-base"
        style={{
          background: isBlossom
            ? 'linear-gradient(135deg, #ffd6e0, #ffe4ec)'
            : 'linear-gradient(135deg, #1a1232, #131320)',
          borderColor: isBlossom ? 'rgba(236,72,153,0.3)' : 'rgba(245,158,11,0.25)',
        }}
      >
        <motion.span
          key={theme}
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="leading-none"
        >
          {isBlossom ? '🌸' : '🌙'}
        </motion.span>
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      aria-label={isBlossom ? 'Switch to Midnight theme' : 'Switch to Cherry Blossom theme'}
      title={isBlossom ? 'Midnight theme' : 'Cherry Blossom theme'}
      className="relative w-full flex items-center gap-2 px-3 py-2 rounded-xl border transition-all overflow-hidden group"
      style={{
        background: isBlossom
          ? 'linear-gradient(135deg, rgba(255, 214, 224, 0.6), rgba(255, 228, 236, 0.6))'
          : 'linear-gradient(135deg, rgba(26, 18, 50, 0.6), rgba(19, 19, 32, 0.6))',
        borderColor: isBlossom ? 'rgba(236,72,153,0.25)' : 'rgba(245,158,11,0.18)',
      }}
    >
      <div
        className="relative w-9 h-5 rounded-full shrink-0 border"
        style={{
          background: isBlossom ? 'rgba(236, 72, 153, 0.18)' : 'rgba(255, 255, 255, 0.06)',
          borderColor: isBlossom ? 'rgba(236, 72, 153, 0.35)' : 'rgba(255, 255, 255, 0.1)',
        }}
      >
        <motion.div
          className="absolute top-[2px] w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] leading-none shadow-md"
          animate={{
            left: isBlossom ? 'calc(100% - 16px)' : '2px',
            background: isBlossom
              ? 'linear-gradient(135deg, #ec4899, #f472b6)'
              : 'linear-gradient(135deg, #fbbf24, #f59e0b)',
          }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </div>
      <span className="text-[11px] font-bold tracking-wide flex-1 text-left">
        {isBlossom ? 'Cherry Blossom' : 'Midnight Gold'}
      </span>
      <motion.span
        key={theme}
        initial={{ scale: 0.8, opacity: 0, rotate: -20 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ duration: 0.35 }}
        className="text-base leading-none"
      >
        {isBlossom ? '🌸' : '🌙'}
      </motion.span>
    </button>
  );
}
