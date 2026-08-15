// Navigation content configuration — UI-only, no role/security logic.
//
// This module maps each navigation-entry id to the content keys that back it.
// It is pure UI config: it decides which nav entries to *attempt* to show given
// the content that actually arrived from the server. Authorization is enforced
// entirely server-side by Row Level Security — this map never grants or denies
// access, it only reflects which nav entries have their backing content present.
//
// The companion pure helper `navIdsFromContent` lives in `src/lib/content.js`;
// it presents a nav entry iff all of that entry's backing keys are present in
// the content object returned by the server.

/**
 * Navigation-entry id → the content keys that back it (drives nav filtering).
 *
 * A nav entry is presented only when all of its backing content keys are
 * present in the content object that arrived from the server.
 */
export const NAV_CONTENT = {
  overview: ['meta'],
  vision: ['vision'],
  streams: ['streams'],
  roadmap: ['roadmap'],
  months: ['months'],
  // Backed by the work-tier rhythm keys only. The personal `dailyRoutine`
  // (owner-only) is NOT a backing key here: employees receive weekly+monthly
  // rhythm and must still see this nav entry, and the Rhythm section shows the
  // Daily tab on its own when `dailyRoutine` data is present (owner).
  rhythm: ['weeklyRhythm', 'monthlyRhythm'],
  focus: ['months'],
  channels: ['channels'],
  pricing: ['pricing'],
  onboarding: ['onboarding'],
  scripts: ['scripts'],
  'institute-outreach': ['instituteOutreach'],
  properties: ['properties'],
  brand: ['brandPlaybook'],
  principles: ['principles'],
  trackers: ['meta'],
  passive: ['streams'],
  'app-ventures': ['appVentures'],
  content: ['brandPlaybook'],
  dubai: ['dubai'],
  settle: ['settle'],
  partnerships: ['partnerships'],
  // Client Acquisition Engine is a UI-only strategy section: its content lives
  // in the component, so it is backed by 'meta' purely to reflect "this role
  // received dashboard content at all" (same approach as trackers).
  'client-engine': ['meta'],
  'lawns-outreach': ['lawnsOutreach'],
  us: ['kaira'],
  kaira: ['kaira'],
  me: ['kaira'],
};
