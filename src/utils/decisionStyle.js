// Presentation helper: maps a Ready2UP qualification decision to the card
// styling that makes it readable at a glance while scrolling a long lead list.
//
// Shared by the Institute Outreach and Lawns & Banquets sections so the two
// segments stay visually consistent. Pure — takes a decision string, returns
// class names. Any unknown/absent value falls back to the neutral 'Undecided'
// styling, so a malformed persisted decision can never produce a broken card.
//
// The styling deliberately combines THREE cues rather than one, because a faint
// background tint alone is easy to miss on a dark theme:
//   1. a saturated left accent bar   (strongest signal while scanning)
//   2. a coloured border
//   3. a background wash

const DECISION_STYLES = {
  Accepted: {
    card: 'relative overflow-hidden !border-emerald-500/50 !bg-emerald-500/[0.10] shadow-[0_0_0_1px_rgba(16,185,129,0.15)]',
    bar: 'bg-emerald-400',
    pill: 'emerald',
  },
  'In progress': {
    card: 'relative overflow-hidden !border-amber-500/50 !bg-amber-500/[0.10] shadow-[0_0_0_1px_rgba(245,158,11,0.15)]',
    bar: 'bg-amber-400',
    pill: 'amber',
  },
  Rejected: {
    card: 'relative overflow-hidden !border-rose-500/45 !bg-rose-500/[0.08] opacity-70',
    bar: 'bg-rose-400',
    pill: 'rose',
  },
  Undecided: {
    card: '',
    bar: '',
    pill: 'slate',
  },
};

/**
 * Returns the styling bundle for a decision.
 *
 * @param {string} decision - one of OUTREACH_DECISIONS; anything else is
 *   treated as 'Undecided'.
 * @returns {{ card: string, bar: string, pill: string }}
 */
export function decisionStyle(decision) {
  return DECISION_STYLES[decision] || DECISION_STYLES.Undecided;
}

/** Convenience: just the card class names for a decision. */
export function decisionCardClass(decision) {
  return decisionStyle(decision).card;
}

/** Convenience: just the left accent-bar class names ('' when undecided). */
export function decisionBarClass(decision) {
  return decisionStyle(decision).bar;
}
