import { useMemo } from 'react';

/**
 * Animated falling cherry blossom petals.
 * Mounts globally — only visible when the cherry blossom theme is active.
 * Uses CSS animations (transform-only) for buttery-smooth performance,
 * even on phones. Pure decoration — pointer-events disabled.
 */
export default function CherryPetals({ active, count = 22, mobileCount = 8, smallCount = 5 }) {
  // Detect screen size at mount — pick a sensible petal count for the device.
  const screen = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const total = screen < 420 ? smallCount : screen < 768 ? mobileCount : count;

  // Generate the petals once, deterministic-ish. Memoized so re-renders don't restart anims.
  const petals = useMemo(() => {
    return Array.from({ length: total }, (_, i) => {
      const seed = (i + 1) * 9301 + 49297;
      const r = (n) => ((Math.sin(seed * n) * 10000) % 1 + 1) % 1;

      return {
        id: i,
        left: r(1) * 100,                              // start X (% of screen width)
        delay: -r(2) * 18,                              // negative delay = mid-anim on load
        fallDuration: 9 + r(3) * 10,                    // 9–19s top→bottom
        swayDuration: 3 + r(4) * 3,                     // 3–6s left↔right
        size: 14 + r(5) * 18,                           // 14–32px
        rotateStart: r(6) * 360,                        // initial rotation
        rotateSpeed: 1 + r(7) * 2.5,                    // how fast it spins as it falls
        opacity: 0.45 + r(8) * 0.45,                    // 0.45–0.9
        swayWidth: 30 + r(9) * 70,                      // 30–100px sway amplitude
        hue: 335 + r(10) * 25,                          // sakura pink range (335–360)
        sat: 70 + r(11) * 18,                           // saturation 70–88
        light: 75 + r(12) * 12,                         // 75–87 lightness
        variant: Math.floor(r(13) * 3),                 // 0,1,2 petal shape
      };
    });
  }, [total]);

  if (!active) return null;

  return (
    <div className="petal-field" aria-hidden="true">
      {petals.map((p) => (
        <span
          key={p.id}
          className="petal-fall"
          style={{
            left: `${p.left}%`,
            animationDuration: `${p.fallDuration}s`,
            animationDelay: `${p.delay}s`,
          }}
        >
          <span
            className="petal-sway"
            style={{
              animationDuration: `${p.swayDuration}s`,
              ['--sway' ]: `${p.swayWidth}px`,
            }}
          >
            <span
              className="petal-spin"
              style={{
                width: `${p.size}px`,
                height: `${p.size}px`,
                opacity: p.opacity,
                animationDuration: `${p.fallDuration / p.rotateSpeed}s`,
                ['--rotate-start']: `${p.rotateStart}deg`,
                color: `hsla(${p.hue}, ${p.sat}%, ${p.light}%, 1)`,
              }}
            >
              <Petal variant={p.variant} />
            </span>
          </span>
        </span>
      ))}
    </div>
  );
}

function Petal({ variant = 0 }) {
  // Three slightly different sakura silhouettes for natural variety
  const paths = [
    'M50 4 C 24 22, 22 60, 50 96 C 78 60, 76 22, 50 4 Z',
    'M50 6 C 18 26, 28 70, 50 94 C 70 78, 84 38, 50 6 Z',
    'M50 5 C 30 18, 14 50, 38 88 C 50 96, 70 80, 80 50 C 86 28, 70 12, 50 5 Z',
  ];
  const d = paths[variant] || paths[0];
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id={`petal-grad-${variant}`} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.9" />
          <stop offset="55%" stopColor="currentColor" stopOpacity="0.7" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.35" />
        </radialGradient>
      </defs>
      <path d={d} fill={`url(#petal-grad-${variant})`} />
      <path d={d} fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5" />
    </svg>
  );
}
