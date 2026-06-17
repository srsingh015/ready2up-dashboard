/**
 * Inline SVG country flags — render identically on Windows, Mac, iOS, Android.
 * Windows does NOT draw emoji flags (shows "IN", "US" etc. instead), so we use
 * small hand-built SVGs. Simplified but instantly recognizable.
 *
 * Usage: <Flag code="IN" className="w-5 h-3.5 rounded-sm" />
 */
export default function Flag({ code, className = 'w-5 h-[15px]' }) {
  const flags = {
    IN: (
      <svg viewBox="0 0 24 16" className={className} preserveAspectRatio="none">
        <rect width="24" height="16" fill="#fff" />
        <rect width="24" height="5.33" fill="#FF9933" />
        <rect y="10.67" width="24" height="5.33" fill="#138808" />
        <circle cx="12" cy="8" r="2.1" fill="none" stroke="#000080" strokeWidth="0.5" />
        <circle cx="12" cy="8" r="0.5" fill="#000080" />
      </svg>
    ),
    AE: (
      <svg viewBox="0 0 24 16" className={className} preserveAspectRatio="none">
        <rect width="24" height="16" fill="#fff" />
        <rect width="24" height="5.33" fill="#00732F" />
        <rect y="10.67" width="24" height="5.33" fill="#000" />
        <rect width="7" height="16" fill="#FF0000" />
      </svg>
    ),
    SG: (
      <svg viewBox="0 0 24 16" className={className} preserveAspectRatio="none">
        <rect width="24" height="16" fill="#fff" />
        <rect width="24" height="8" fill="#EF3340" />
        <circle cx="5.5" cy="4" r="2.6" fill="#fff" />
        <circle cx="6.7" cy="4" r="2.4" fill="#EF3340" />
        <g fill="#fff">
          <circle cx="8.6" cy="2.2" r="0.5" />
          <circle cx="10" cy="3.2" r="0.5" />
          <circle cx="10" cy="4.9" r="0.5" />
          <circle cx="8.6" cy="5.9" r="0.5" />
          <circle cx="7.7" cy="4.05" r="0.5" />
        </g>
      </svg>
    ),
    US: (
      <svg viewBox="0 0 24 16" className={className} preserveAspectRatio="none">
        <rect width="24" height="16" fill="#fff" />
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <rect key={i} y={i * 2.46} width="24" height="1.23" fill="#B22234" />
        ))}
        <rect width="10" height="8.6" fill="#3C3B6E" />
        <g fill="#fff">
          {[1.8, 4.2, 6.6].map((y) =>
            [1.5, 3.5, 5.5, 7.5].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="0.45" />)
          )}
        </g>
      </svg>
    ),
    GB: (
      <svg viewBox="0 0 24 16" className={className} preserveAspectRatio="none">
        <rect width="24" height="16" fill="#012169" />
        <path d="M0,0 L24,16 M24,0 L0,16" stroke="#fff" strokeWidth="3.2" />
        <path d="M0,0 L24,16 M24,0 L0,16" stroke="#C8102E" strokeWidth="1.8" />
        <rect x="9.5" width="5" height="16" fill="#fff" />
        <rect y="5.5" width="24" height="5" fill="#fff" />
        <rect x="10.5" width="3" height="16" fill="#C8102E" />
        <rect y="6.5" width="24" height="3" fill="#C8102E" />
      </svg>
    ),
    AU: (
      <svg viewBox="0 0 24 16" className={className} preserveAspectRatio="none">
        <rect width="24" height="16" fill="#012169" />
        {/* mini union jack top-left */}
        <g>
          <rect width="12" height="8" fill="#012169" />
          <path d="M0,0 L12,8 M12,0 L0,8" stroke="#fff" strokeWidth="1.6" />
          <path d="M0,0 L12,8 M12,0 L0,8" stroke="#C8102E" strokeWidth="0.9" />
          <rect x="4.75" width="2.5" height="8" fill="#fff" />
          <rect y="2.75" width="12" height="2.5" fill="#fff" />
          <rect x="5.25" width="1.5" height="8" fill="#C8102E" />
          <rect y="3.25" width="12" height="1.5" fill="#C8102E" />
        </g>
        <g fill="#fff">
          <circle cx="6" cy="12.5" r="0.7" />
          <circle cx="17" cy="3" r="0.6" />
          <circle cx="19.5" cy="6.5" r="0.6" />
          <circle cx="16.5" cy="9.5" r="0.6" />
          <circle cx="20.5" cy="11" r="0.6" />
          <circle cx="18" cy="13" r="0.45" />
        </g>
      </svg>
    ),
    EU: (
      <svg viewBox="0 0 24 16" className={className} preserveAspectRatio="none">
        <rect width="24" height="16" fill="#003399" />
        <g fill="#FFCC00">
          {Array.from({ length: 12 }).map((_, i) => {
            const ang = (i / 12) * 2 * Math.PI - Math.PI / 2;
            const cx = 12 + Math.cos(ang) * 4.6;
            const cy = 8 + Math.sin(ang) * 4.6;
            return <circle key={i} cx={cx} cy={cy} r="0.7" />;
          })}
        </g>
      </svg>
    ),
    NZ: (
      <svg viewBox="0 0 24 16" className={className} preserveAspectRatio="none">
        <rect width="24" height="16" fill="#00247D" />
        {/* mini union jack, top-left quadrant */}
        <g>
          <path d="M0,0 L12,8 M12,0 L0,8" stroke="#fff" strokeWidth="1.6" />
          <path d="M0,0 L12,8 M12,0 L0,8" stroke="#CC142B" strokeWidth="0.9" />
          <rect x="4.75" width="2.5" height="8" fill="#fff" />
          <rect y="2.75" width="12" height="2.5" fill="#fff" />
          <rect x="5.25" width="1.5" height="8" fill="#CC142B" />
          <rect y="3.25" width="12" height="1.5" fill="#CC142B" />
        </g>
        {/* Southern Cross — 4 red stars with white edges */}
        <g>
          <g fill="#CC142B" stroke="#fff" strokeWidth="0.35">
            <circle cx="19" cy="4" r="0.85" />
            <circle cx="21" cy="8.5" r="0.95" />
            <circle cx="17" cy="9" r="0.85" />
            <circle cx="19" cy="12.5" r="0.85" />
          </g>
        </g>
      </svg>
    ),
  };

  return (
    <span className={`inline-block overflow-hidden rounded-[3px] ring-1 ring-black/10 shrink-0 ${className}`} aria-hidden="true">
      {flags[code] || null}
    </span>
  );
}
